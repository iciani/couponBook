export const useValidationRules = () => {
  const validateEmail = email =>
    /^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/.test(email)

  const validateEmails = emails => {
    if (emails == null) return true
    if (Array.isArray(emails)) {
      return emails.every(email =>
        typeof email === 'object' ? validateEmail(email.email) : validateEmail(email),
      )
    }
    
    return validateEmail(emails)
  }

  const requiredTextRule = [
    v => (v !== undefined && v !== null && String(v).trim().length > 0) || 'Field is required',
  ]

  const requiredArrayRule = [
    v => (v?.length > 0) || 'Field is required',
  ]

  const requiredFileRule = [
    file => !!file || (file && file.size > 0) || 'File is Required.',
  ]

  const validJSONRule = [
    v => {
      try {
        return v === null || !!JSON.parse(v)
      } catch {
        return 'Not a valid JSON'
      }
    },
  ]

  const durationTimeRule = [
    v => (v ? /^(0\d|1\d|2[0-4]):[0-5]\d$/.test(v) : true) || 'Must be in HH:MM format.',
  ]

  const validEmailRule = [
    v => validateEmails(v) || 'Invalid email address',
  ]

  const duplicateEmailRule = [
    emails => {
      const seen = new Set()
      const values = emails.map(e => typeof e === 'object' ? e.email : e)
      for (const email of values) {
        if (seen.has(email)) return 'Duplicate email addresses'
        seen.add(email)
      }
      
      return true
    },
  ]

  const passwordRules = [
    v => !!v || 'Field is required',
    v =>
      (!!v && v.length >= 8 && v.length <= 32) ||
      'Password must be between 8 and 32 characters',
    v => {
      if (!v) return 'Field is required'

      const tests = [
        { regex: /[A-Z]/, message: 'one uppercase letter' },
        { regex: /[a-z]/, message: 'one lowercase letter' },
        { regex: /\d/, message: 'one number' },
        { regex: /[^A-Z0-9]/i, message: 'one symbol' },
      ]

      const failed = tests.filter(t => !t.regex.test(v)).map(t => t.message)

      return failed.length < 2 || `Password must include at least ${failed.join(', ')}.`
    },
  ]

  const mustBePositiveNumberRule = [
    v => (v !== undefined && v !== null && v > 0) || 'Field must be a positive number',
  ]

  const mustBeNumberRule = [
    v => (!Number.isNaN(v) && v !== undefined && v !== null && v !== '') || 'Field must be a number',
  ]

  const optionalNumberRule = [
    v => (v === '' || v === null || v === undefined || (!Number.isNaN(Number(v)) && Number.isFinite(Number(v)))) || 'Field must be a number',
  ]

  const mustBeIntegerRule = [
    v => (v === undefined || v === null || Number.isInteger(Number(v))) || 'Field must be an integer',
  ]

  const validUrlRule = [
    v => {
      if (!v) return true
      try {
        const url = new URL(v.startsWith('http') ? v : `https://${v}`)
        
        return url.hostname.includes('.') || 'Invalid URL address'
      } catch {
        return 'Invalid URL address'
      }
    },
  ]

  const minCharactersRule = (min, label = 'Field') => [
    v => (v || '').length >= min || `${label} must be ${min} characters or more.`,
  ]

  const maxCharactersRule = (max, label = 'Field') => [
    v => (v || '').length <= max || `${label} must be ${max} characters or less.`,
  ]

  const filesShouldBeLessThanMBRule = mb => [
    files =>
      !(files?.reduce((t, f) => t + f.size, 0) > 1024 * 1024 * mb) ||
      `File size should be less than ${mb} mb.`,
  ]

  const fileShouldBeLessThanMBRule = mb => [
    file => !(file?.size > 1024 * 1024 * mb) || `File size should be less than ${mb} mb.`,
  ]

  const shouldNotExistRule = values => [
    v => !values.includes(v) || `"${v}" already exists.`,
  ]

  return {
    requiredTextRule,
    requiredArrayRule,
    requiredFileRule,
    validJSONRule,
    durationTimeRule,
    validEmailRule,
    duplicateEmailRule,
    passwordRules,
    mustBePositiveNumberRule,
    mustBeNumberRule,
    optionalNumberRule,
    mustBeIntegerRule,
    validUrlRule,
    minCharactersRule,
    maxCharactersRule,
    filesShouldBeLessThanMBRule,
    fileShouldBeLessThanMBRule,
    shouldNotExistRule,
  }
}
