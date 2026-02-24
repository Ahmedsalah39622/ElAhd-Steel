const { getDb } = require('../models');

async function verifySupplierBalance() {
  try {
    console.log('Connecting to database...');
    const db = await getDb();
    const { Supplier, PurchaseOrder, SafeEntry } = db;

    // 1. Create Test Supplier
    console.log('Creating test supplier...');
    const supplier = await Supplier.create({
      name: 'Test Supplier ' + Date.now(),
      phone: '0123456789',
      address: 'Test Address'
    });
    console.log(`Created Supplier: ${supplier.name} (ID: ${supplier.id})`);

    // 2. Initial Balance Check
    await checkBalance(supplier.id, 0);

    // 3. Create Credit Purchase Order (We owe money)
    console.log('Creating Credit Purchase Order for 1000...');
    // We need a material for the PO, let's just use a dummy material ID or create one if strict FK
    // Assuming we need a material. Let's see if we can get one.
    const material = await db.Material.findOne();
    let materialId = material ? material.id : null;
    
    if (!materialId) {
        console.log('No material found, creating one...');
        const newMat = await db.Material.create({ name: 'Test Material', unit: 'kg', price: 10 });
        materialId = newMat.id;
    }

    await PurchaseOrder.create({
      orderNumber: 'PO-' + Date.now(),
      supplierId: supplier.id,
      materialId: materialId,
      price: 100,
      quantity: 10,
      totalAmount: 1000,
      paymentStatus: 'credit',
      paidAmount: 0,
      status: 'completed'
    });
    console.log('Created Credit PO for 1000');

    // 4. Verify Balance (Should be 1000)
    await checkBalance(supplier.id, 1000);

    // 5. Create Supplier Payment via SafeEntry (Outgoing)
    console.log('Creating Supplier Payment of 400...');
    await SafeEntry.create({
      date: new Date(),
      description: 'Payment to ' + supplier.name,
      outgoing: 400,
      supplierId: supplier.id,
      entryType: 'outgoing' // or 'supplier-payment' depending on what the backend uses for filtering, but key is supplierId and outgoing > 0
    });
    console.log('Created Payment of 400');

    // 6. Verify Balance (Should be 1000 - 400 = 600)
    await checkBalance(supplier.id, 600);

    console.log('Verification Successful!');
    process.exit(0);

  } catch (error) {
    console.error('Verification Failed:', error);
    process.exit(1);
  }
}

async function checkBalance(supplierId, expectedBalance) {
    const db = await getDb();
    const { PurchaseOrder, SafeEntry } = db;
    
    const totalPurchases = await PurchaseOrder.sum('totalAmount', { where: { supplierId } }) || 0;
    const totalPaidFromOrders = await PurchaseOrder.sum('paidAmount', { where: { supplierId } }) || 0;
    const totalPayments = await SafeEntry.sum('outgoing', { where: { supplierId } }) || 0;

    const balance = Number(totalPurchases) - Number(totalPaidFromOrders) - Number(totalPayments);
    
    console.log(`Balance Check: Purchases=${totalPurchases}, PaidOnOrder=${totalPaidFromOrders}, Payments=${totalPayments} => Balance=${balance}`);
    
    if (balance !== expectedBalance) {
        throw new Error(`Expected balance ${expectedBalance} but got ${balance}`);
    }
}

// Run headers
verifySupplierBalance();
