const pdfParseLib = require('pdf-parse'); // Renamed to avoid confusion

// Try to find the function
console.log('Is PDFParse a function?', typeof pdfParseLib.PDFParse);

try {
    // If PDFParse is a class or function, let's try to invoke it or new it?
    // But usually pdf-parse is just a function.

    // Let's print the export again to be sure
    console.log(pdfParseLib);

} catch (e) {
    console.error(e);
}
