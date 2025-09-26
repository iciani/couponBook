const { codeGenerationQueue } = require('../lib/queue');
const { CouponCode, CouponBook } = require('../models');
const { Op } = require('sequelize');

// Configurar concurrencia - procesar hasta 3 jobs simultáneamente
const CONCURRENCY = process.env.CODE_GENERATION_CONCURRENCY || 3;

codeGenerationQueue.process('generate-codes', CONCURRENCY, async (job) => {
  const { bookId, quantity, pattern, batchSize = 5000 } = job.data;
  
  console.log(`Processing job ${job.id}: Generating ${quantity} codes for book ${bookId}`);
  
  try {
    // Verificar que el book existe y está activo
    const book = await CouponBook.findByPk(bookId);
    if (!book) {
      throw new Error(`Book ${bookId} not found`);
    }
    
    if (book.status === 'ARCHIVED') {
      throw new Error(`Cannot generate codes for archived book ${bookId}`);
    }
    
    // Verificar límite de códigos
    const existingCodesCount = await CouponCode.count({
      where: { book_id: bookId }
    });
    
    const maxCodes = book.total_codes || Infinity;
    if (existingCodesCount + quantity > maxCodes) {
      throw new Error(`Cannot generate ${quantity} codes. Maximum allowed: ${maxCodes}, existing: ${existingCodesCount}`);
    }
    
    let codePattern = pattern || book.code_pattern || "CODE-####";
    
    // Asegurar que el patrón incluya el book ID para evitar duplicados entre books
    if (!codePattern.includes('{BOOK_ID}')) {
      // Si el patrón no tiene placeholder para book ID, agregarlo al inicio
      codePattern = `{BOOK_ID}-${codePattern}`;
    }
    
    // Reemplazar el placeholder con el book ID real
    codePattern = codePattern.replace('{BOOK_ID}', bookId);
    
    // Configuración optimizada para lotes
    const BATCH_SIZE = Math.min(batchSize, 5000); // Máximo 5000 por lote
    let totalGenerated = 0;
    let totalProcessed = 0;

    // Función para generar lote de códigos
    const generateBatch = (batchSize, pattern) => {
      console.log(`generateBatch called with batchSize: ${batchSize}, pattern: ${pattern}`);
      const codes = new Set(); // Usar Set para evitar duplicados en memoria
      const maxAttempts = batchSize * 2; // Reducido porque ya no hay conflictos entre books
      let attempts = 0;
      
      while (codes.size < batchSize && attempts < maxAttempts) {
        const code = pattern.replace(/#/g, () => Math.floor(Math.random() * 10))
                           .replace(/\$/g, () => String.fromCharCode(65 + Math.floor(Math.random() * 26)))
                           .replace(/\*/g, () => String.fromCharCode(97 + Math.floor(Math.random() * 26)));
        codes.add(code);
        attempts++;
      }
      
      console.log(`Generated ${codes.size} codes in ${attempts} attempts`);
      
      // Si no pudimos generar suficientes códigos únicos, agregar timestamp
      if (codes.size < batchSize) {
        console.log(`WARNING: Solo se generaron ${codes.size} códigos únicos de ${batchSize} solicitados`);
        console.log(`Patrón: ${pattern} - Puede ser muy restrictivo`);
        
        // Generar códigos adicionales con timestamp para completar el lote
        const remaining = batchSize - codes.size;
        for (let i = 0; i < remaining; i++) {
          const timestamp = Date.now().toString(36);
          const random = Math.random().toString(36).substring(2, 8);
          const fallbackCode = `${pattern.replace(/[#$*]/g, '')}-${timestamp}-${random}`;
          codes.add(fallbackCode);
        }
      }
      
      return Array.from(codes);
    };
    
    // Función para verificar códigos existentes en BD (solo para el mismo book)
    const checkExistingCodes = async (codes, bookId) => {
      console.log(`checkExistingCodes called with ${codes.length} codes for book ${bookId}`);
      const existingCodes = await CouponCode.findAll({
        where: {
          code: {
            [Op.in]: codes
          },
          book_id: bookId // Solo verificar en el mismo book
        },
        attributes: ['code'],
        raw: true
      });
      
      console.log(`Found ${existingCodes.length} existing codes in database`);
      const existingSet = new Set(existingCodes.map(item => item.code));
      const uniqueCodes = codes.filter(code => !existingSet.has(code));
      console.log(`Returning ${uniqueCodes.length} unique codes`);
      return uniqueCodes;
    };
    
    // Función para insertar códigos (con verificación de duplicados en BD)
    const insertCodes = async (codes, bookId) => {
      console.log(`insertCodes called with ${codes.length} codes for book ${bookId}`);
      console.log(`Sample codes: ${codes.slice(0, 3).join(', ')}`);
      
      const codesToInsert = codes.map(code => ({
        book_id: bookId,
        code: code,
        status: "AVAILABLE",
        created_at: new Date(),
        updated_at: new Date(),
      }));
      
      console.log(`Prepared ${codesToInsert.length} codes for insertion`);
      
      try {
        await CouponCode.bulkCreate(codesToInsert, {
          validate: false,
          returning: false
        });
        console.log(`Successfully bulk inserted ${codesToInsert.length} codes`);
        return codesToInsert.length;
      } catch (error) {
        console.error(`Bulk insert failed: ${error.message}`);
        if (error.name === 'SequelizeUniqueConstraintError') {
          // Si hay duplicados, procesar uno por uno
          let inserted = 0;
          for (const codeData of codesToInsert) {
            try {
              await CouponCode.create(codeData, { validate: false });
              inserted++;
            } catch (duplicateError) {
              if (duplicateError.name === 'SequelizeUniqueConstraintError') {
                // Generar código alternativo con timestamp
                const timestamp = Date.now().toString(36);
                const random = Math.random().toString(36).substring(2, 8);
                const alternativeCode = `${codeData.code}-${timestamp}-${random}`;
                
                try {
                  await CouponCode.create({
                    ...codeData,
                    code: alternativeCode
                  });
                  inserted++;
                } catch (finalError) {
                  console.error(`Error creando código alternativo: ${finalError.message}`);
                }
              }
            }
          }
          return inserted;
        } else {
          throw error;
        }
      }
    };
    
    // Bucle principal para generar códigos
    console.log(`Starting generation loop for ${quantity} codes with pattern: ${codePattern}`);
    
    while (totalGenerated < quantity) {
      const remaining = quantity - totalGenerated;
      const currentBatchSize = Math.min(remaining, BATCH_SIZE);
      
      console.log(`Generating batch of ${currentBatchSize} codes (${totalGenerated}/${quantity} completed)`);
      
      // Generar códigos candidatos
      const generatedCodes = generateBatch(currentBatchSize, codePattern);
      console.log(`Generated ${generatedCodes.length} candidate codes`);
      
      // Verificar duplicados en BD
      const uniqueCodes = await checkExistingCodes(generatedCodes, bookId);
      console.log(`Found ${uniqueCodes.length} unique codes after DB check`);
      
      if (uniqueCodes.length === 0) {
        console.warn(`No unique codes found in this batch. Retrying...`);
        await new Promise(resolve => setTimeout(resolve, 100)); // Pequeña pausa
        continue;
      }
      
      // Insertar códigos únicos
      console.log(`Inserting ${uniqueCodes.length} codes into database...`);
      const insertedCount = await insertCodes(uniqueCodes, bookId);
      console.log(`Successfully inserted ${insertedCount} codes`);
      
      totalGenerated += insertedCount;
      
      // Actualizar progreso
      job.progress(Math.floor((totalGenerated / quantity) * 100));
      
      console.log(`Progreso: ${totalGenerated}/${quantity} códigos generados (${Math.floor((totalGenerated / quantity) * 100)}%)`);
      
      // Pequeña pausa entre lotes para no sobrecargar la BD
      if (totalGenerated < quantity) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }
    
    // Actualizar progreso final
    job.progress(100);
    
    console.log(`Job ${job.id} completed: Generated ${totalGenerated} codes of ${quantity} requested`);
    
    return {
      success: true,
      generatedCount: totalGenerated,
      requestedCount: quantity,
      bookId,
      pattern: codePattern,
      efficiency: `${Math.round((totalGenerated / quantity) * 100)}%`,
      method: 'Optimized'
    };
    
  } catch (error) {
    console.error(`Job ${job.id} failed:`, error.message);
    throw error;
  }
});

console.log(`Code generation worker (OPTIMIZED) started with concurrency: ${CONCURRENCY}`);

module.exports = codeGenerationQueue;