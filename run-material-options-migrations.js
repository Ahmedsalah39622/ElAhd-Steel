const { Sequelize } = require('sequelize')
require('dotenv').config()

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  }
})

async function runMigrations() {
  try {
    const queryInterface = sequelize.getQueryInterface()

    console.log('Creating MaterialUnits table...')
    await queryInterface.createTable('MaterialUnits', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      value: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      label: {
        type: Sequelize.STRING,
        allowNull: false
      },
      isCustom: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    })

    await queryInterface.bulkInsert('MaterialUnits', [
      { value: 'pcs', label: 'قطعة', isCustom: false, createdAt: new Date(), updatedAt: new Date() },
      { value: 'kg', label: 'كجم', isCustom: false, createdAt: new Date(), updatedAt: new Date() },
      { value: 'ton', label: 'طن', isCustom: false, createdAt: new Date(), updatedAt: new Date() },
      { value: 'meter', label: 'متر', isCustom: false, createdAt: new Date(), updatedAt: new Date() },
      { value: 'liter', label: 'لتر', isCustom: false, createdAt: new Date(), updatedAt: new Date() },
      { value: 'box', label: 'صندوق', isCustom: false, createdAt: new Date(), updatedAt: new Date() },
      { value: 'other', label: 'أخرى', isCustom: false, createdAt: new Date(), updatedAt: new Date() }
    ])

    console.log('Creating MaterialCategories table...')
    await queryInterface.createTable('MaterialCategories', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      value: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      label: {
        type: Sequelize.STRING,
        allowNull: false
      },
      isCustom: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    })

    await queryInterface.bulkInsert('MaterialCategories', [
      { value: 'stainless', label: 'ستانلس', isCustom: false, createdAt: new Date(), updatedAt: new Date() },
      { value: 'galvanized', label: 'مجلفن', isCustom: false, createdAt: new Date(), updatedAt: new Date() },
      { value: 'black', label: 'أسود', isCustom: false, createdAt: new Date(), updatedAt: new Date() },
      { value: 'aluminum', label: 'ألومنيوم', isCustom: false, createdAt: new Date(), updatedAt: new Date() },
      { value: 'copper', label: 'نحاس', isCustom: false, createdAt: new Date(), updatedAt: new Date() },
      { value: 'accessory', label: 'اكسسوار', isCustom: false, createdAt: new Date(), updatedAt: new Date() },
      { value: 'other', label: 'أخرى', isCustom: false, createdAt: new Date(), updatedAt: new Date() }
    ])

    console.log('Creating MaterialGrades table...')
    await queryInterface.createTable('MaterialGrades', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      categoryValue: {
        type: Sequelize.STRING,
        allowNull: false
      },
      value: {
        type: Sequelize.STRING,
        allowNull: false
      },
      label: {
        type: Sequelize.STRING,
        allowNull: false
      },
      isCustom: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    })

    await queryInterface.addConstraint('MaterialGrades', {
      fields: ['categoryValue', 'value'],
      type: 'unique',
      name: 'unique_category_grade'
    })

    await queryInterface.bulkInsert('MaterialGrades', [
      { categoryValue: 'stainless', value: '304', label: '304', isCustom: false, createdAt: new Date(), updatedAt: new Date() },
      { categoryValue: 'stainless', value: '316', label: '316', isCustom: false, createdAt: new Date(), updatedAt: new Date() },
      { categoryValue: 'stainless', value: '208', label: '208', isCustom: false, createdAt: new Date(), updatedAt: new Date() },
      { categoryValue: 'galvanized', value: '275', label: '275', isCustom: false, createdAt: new Date(), updatedAt: new Date() },
      { categoryValue: 'galvanized', value: '330', label: '330', isCustom: false, createdAt: new Date(), updatedAt: new Date() },
      { categoryValue: 'black', value: 'cold', label: 'بارد', isCustom: false, createdAt: new Date(), updatedAt: new Date() },
      { categoryValue: 'black', value: 'hot', label: 'ساخن', isCustom: false, createdAt: new Date(), updatedAt: new Date() },
      { categoryValue: 'aluminum', value: '6063', label: '6063', isCustom: false, createdAt: new Date(), updatedAt: new Date() }
    ])

    console.log('✅ All tables created and seeded successfully!')
    await sequelize.close()
  } catch (error) {
    console.error('❌ Error:', error)
    await sequelize.close()
    process.exit(1)
  }
}

runMigrations()
