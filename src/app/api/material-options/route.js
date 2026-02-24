import { NextResponse } from 'next/server'

// GET: Fetch all units, categories, or grades
export async function GET(request) {
  try {
    const modelsModule = require('../../../../models')
    const db = await modelsModule.getDb()
    const { MaterialUnit, MaterialCategory, MaterialGrade } = db

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'units', 'categories', 'grades'
    const categoryValue = searchParams.get('categoryValue') // for grades filter

    if (type === 'units') {
      const units = await MaterialUnit.findAll({
        order: [
          ['isCustom', 'ASC'],
          ['label', 'ASC']
        ]
      })

      return NextResponse.json({ success: true, data: units })
    }

    if (type === 'categories') {
      const categories = await MaterialCategory.findAll({
        order: [
          ['isCustom', 'ASC'],
          ['label', 'ASC']
        ]
      })

      return NextResponse.json({ success: true, data: categories })
    }

    if (type === 'grades') {
      const where = categoryValue ? { categoryValue } : {}

      const grades = await MaterialGrade.findAll({
        where,
        order: [
          ['categoryValue', 'ASC'],
          ['isCustom', 'ASC'],
          ['label', 'ASC']
        ]
      })

      return NextResponse.json({ success: true, data: grades })
    }

    return NextResponse.json({ success: false, message: 'Invalid type parameter' }, { status: 400 })
  } catch (error) {
    console.error('Error fetching material options:', error)

    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}

// POST: Add new unit, category, or grade
export async function POST(request) {
  try {
    const modelsModule = require('../../../../models')
    const db = await modelsModule.getDb()
    const { MaterialUnit, MaterialCategory, MaterialGrade } = db

    const body = await request.json()
    const { type, value, label, categoryValue } = body

    if (!type || !value || !label) {
      return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 })
    }

    if (type === 'unit') {
      // Check if exists
      const existing = await MaterialUnit.findOne({ where: { value } })

      if (existing) {
        return NextResponse.json({ success: false, message: 'الوحدة موجودة بالفعل' }, { status: 409 })
      }

      const unit = await MaterialUnit.create({ value, label, isCustom: true })

      return NextResponse.json({ success: true, data: unit })
    }

    if (type === 'category') {
      const existing = await MaterialCategory.findOne({ where: { value } })

      if (existing) {
        return NextResponse.json({ success: false, message: 'نوع الخامة موجود بالفعل' }, { status: 409 })
      }

      const category = await MaterialCategory.create({ value, label, isCustom: true })

      return NextResponse.json({ success: true, data: category })
    }

    if (type === 'grade') {
      if (!categoryValue) {
        return NextResponse.json({ success: false, message: 'categoryValue is required for grades' }, { status: 400 })
      }

      const existing = await MaterialGrade.findOne({ where: { categoryValue, value } })

      if (existing) {
        return NextResponse.json({ success: false, message: 'الدرجة موجودة بالفعل لهذا النوع' }, { status: 409 })
      }

      const grade = await MaterialGrade.create({ categoryValue, value, label, isCustom: true })

      return NextResponse.json({ success: true, data: grade })
    }

    return NextResponse.json({ success: false, message: 'Invalid type' }, { status: 400 })
  } catch (error) {
    console.error('Error adding material option:', error)

    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}

