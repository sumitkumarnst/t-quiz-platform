const officeParser = require('office-text-extractor');
console.log('Type:', typeof officeParser);
console.log('Keys:', Object.keys(officeParser));

// Check if it's a function itself (common for this lib)
try {
    console.log('Is it a function?', typeof officeParser === 'function');
} catch (e) { }
