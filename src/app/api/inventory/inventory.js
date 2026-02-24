// This app router API is disabled. Use /pages/api/inventory.js instead.
// The pages router API properly handles requests without returning HTML.

export default function handler(req, res) {
  res.status(307).redirect('/api/inventory') // Redirect to pages API
}
