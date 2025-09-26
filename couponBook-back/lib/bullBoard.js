const { createBullBoard } = require('@bull-board/api');
const { BullAdapter } = require('@bull-board/api/bullAdapter');
const { ExpressAdapter } = require('@bull-board/express');
const { codeGenerationQueue } = require('./queue');

// Crear el adaptador de Express
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

// Crear el board con las colas
const { addQueue, removeQueue, setQueues, replaceQueues } = createBullBoard({
  queues: [
    new BullAdapter(codeGenerationQueue)
  ],
  serverAdapter: serverAdapter,
});

// Función para agregar nuevas colas dinámicamente
const addQueueToBoard = (queue) => {
  addQueue(new BullAdapter(queue));
};

// Función para remover colas
const removeQueueFromBoard = (queueName) => {
  removeQueue(queueName);
};

module.exports = {
  serverAdapter,
  addQueueToBoard,
  removeQueueFromBoard,
  setQueues,
  replaceQueues
};
