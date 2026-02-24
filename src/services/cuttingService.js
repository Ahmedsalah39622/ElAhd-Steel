// cuttingService.js
// خوارزمية عامة لحساب كل البقايا الممكنة بعد عملية قطع مستطيلة واحدة أو أكثر من لوح خام
// يمكن تطويرها لاحقاً لدعم القطع المتعدد أو القطع غير المستطيل

/**
 * cutRectFromSheet
 * @param {Object} sheet - اللوح الأصلي { length, width, id }
 * @param {Array} cuts - مصفوفة القطع المطلوبة [{ length, width, id, quantity }]
 * @returns {Object} { usedCuts: [], leftovers: [] }
 */
function cutRectFromSheet(sheet, cuts) {
  let leftovers = []
  let usedCuts = []
  // مبدئياً: فقط أول قطعة (cut) من الزاوية اليسرى العليا
  // لاحقاً: يمكن دعم القطع المتعدد أو القطع من المنتصف
  if (!cuts || cuts.length === 0) return { usedCuts, leftovers: [sheet] }
  const cut = cuts[0]
  const L = parseFloat(sheet.length)
  const W = parseFloat(sheet.width)
  const A = parseFloat(cut.length)
  const B = parseFloat(cut.width)
  if (A > L || B > W) {
    // القطعة المطلوبة أكبر من اللوح
    return { usedCuts, leftovers: [sheet] }
  }
  usedCuts.push({ ...cut, fromSheetId: sheet.id })
  // الباقي: مستطيلين (يمين وأسفل)
  // 1. باقي الطول (يمين القطعة)
  if (L - A > 0) {
    leftovers.push({ length: L - A, width: W, parentSheetId: sheet.id })
  }
  // 2. باقي العرض (أسفل القطعة)
  if (B < W) {
    leftovers.push({ length: A, width: W - B, parentSheetId: sheet.id })
  }
  return { usedCuts, leftovers }
}

module.exports = { cutRectFromSheet }
