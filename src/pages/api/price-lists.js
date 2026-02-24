import { initializeDatabase } from '@/utils/db'

export default async function handler(req, res) {
  try {
    const { sequelize, PriceList, Client, Material } = await initializeDatabase()

    if (req.method === 'GET') {
      const { id, clientId } = req.query

      if (id) {
        const priceList = await PriceList.findByPk(id)

        if (!priceList) {
          return res.status(404).json({ error: 'Price list not found' })
        }

        // Parse JSON fields
        const result = priceList.toJSON()

        try {
          result.items = typeof result.items === 'string' ? JSON.parse(result.items) : result.items || []
          result.manufacturingItems =
            typeof result.manufacturingItems === 'string'
              ? JSON.parse(result.manufacturingItems)
              : result.manufacturingItems || []
        } catch (e) {
          result.items = []
          result.manufacturingItems = []
        }

        return res.status(200).json(result)
      }

      const where = {}

      if (clientId) {
        where.clientId = clientId
      }

      const priceLists = await PriceList.findAll({
        where,
        order: [['createdAt', 'DESC']]
      })

      return res.status(200).json(priceLists)
    }

    if (req.method === 'POST') {
      const {
        clientId,
        clientName,
        projectName,
        projectDescription,
        items,
        manufacturingItems,
        notes,
        validUntil,
        status
      } = req.body

      const priceList = await PriceList.create({
        clientId: clientId || null,
        clientName: clientName || '',
        projectName: projectName || '',
        projectDescription: projectDescription || '',
        items: JSON.stringify(items || []),
        manufacturingItems: JSON.stringify(manufacturingItems || []),
        notes: notes || '',
        validUntil: validUntil || null,
        status: status || 'draft'
      })

      return res.status(201).json(priceList)
    }

    if (req.method === 'PUT') {
      const { id: queryId } = req.query

      const {
        id: bodyId,
        clientId,
        clientName,
        projectName,
        projectDescription,
        items,
        manufacturingItems,
        notes,
        validUntil,
        status
      } = req.body

      const id = queryId || bodyId

      const priceList = await PriceList.findByPk(id)

      if (!priceList) {
        return res.status(404).json({ error: 'Price list not found' })
      }

      await priceList.update({
        clientId: clientId || priceList.clientId,
        clientName: clientName || priceList.clientName,
        projectName: projectName || priceList.projectName,
        projectDescription: projectDescription || priceList.projectDescription,
        items: items ? JSON.stringify(items) : priceList.items,
        manufacturingItems: manufacturingItems ? JSON.stringify(manufacturingItems) : priceList.manufacturingItems,
        notes: notes !== undefined ? notes : priceList.notes,
        validUntil: validUntil || priceList.validUntil,
        status: status || priceList.status
      })

      return res.status(200).json(priceList)
    }

    if (req.method === 'DELETE') {
      const { id } = req.query

      const priceList = await PriceList.findByPk(id)

      if (!priceList) {
        return res.status(404).json({ error: 'Price list not found' })
      }

      await priceList.destroy()

      return res.status(200).json({ message: 'Price list deleted' })
    }

    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE'])

    return res.status(405).end(`Method ${req.method} Not Allowed`)
  } catch (error) {
    console.error('Price lists API error:', error)

    return res.status(500).json({ error: error.message })
  }
}
