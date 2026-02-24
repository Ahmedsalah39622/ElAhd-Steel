// Debug: check what pieces exist after cutting
const modelsModule = require('./models')

async function main() {
  const db = await modelsModule.getDb()
  const { MaterialPiece } = db
  
  console.log('\n=== ALL Pieces for Material 5 (نحاس) ===')
  const allPieces = await MaterialPiece.findAll({
    order: [['id', 'ASC']],
    where: { materialId: 5 }
  })
  
  for (const p of allPieces) {
    const pData = p.toJSON ? p.toJSON() : p
    console.log(`ID: ${pData.id}, Dims: ${pData.length}x${pData.width}, Parent: ${pData.parentPieceId}, Status: ${pData.status}, isLeftover: ${pData.isLeftover}`)
  }
  
  console.log('\nTotal pieces:', allPieces.length)
  
  // Find available pieces
  const available = allPieces.filter(p => p.status === 'available')
  console.log('\nAvailable pieces:')
  available.forEach(p => {
    const pData = p.toJSON ? p.toJSON() : p
    console.log(`  ID: ${pData.id}, Dims: ${pData.length}x${pData.width}`)
  })
  
  process.exit(0)
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
