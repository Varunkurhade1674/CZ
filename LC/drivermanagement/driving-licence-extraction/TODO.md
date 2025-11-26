# TODO: Add LMV and MCWG Date Extraction

- [x] Update license model schema in models/license.js to include lmvValidity and mcwgValidity fields in extractedData
- [x] Update AI prompt in routes/LicenseRoutes.js to extract LMV validity date and MCWG validity date
- [x] Update response schema in AI config to include lmvValidity and mcwgValidity fields
- [x] Restart the server to apply changes
- [ ] Test the extraction with a sample image to verify LMV and MCWG dates are extracted and saved
