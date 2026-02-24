export default function Page() {
  return (
    <div dir='rtl' className='p-6'>
      <h1 className='text-2xl font-bold mb-6'>عن أوركا للحديد والصلب</h1>
      
      <section className='mb-6'>
        <h2 className='text-xl font-semibold mb-3'>من نحن</h2>
        <p className='text-gray-600 dark:text-gray-400'>
          نظام أوركا للحديد والصلب هو نظام متكامل لإدارة أعمال الحديد والصلب.
        </p>
      </section>

      <section className='mb-6'>
        <h2 className='text-xl font-semibold mb-3'>معلومات النظام</h2>
        <div className='space-y-2'>
          <p><strong>الإصدار:</strong> 1.0.0</p>
          <p><strong>المطور:</strong> ITTSOFT</p>
          <p><strong>التواصل:</strong> info@ittsoft.com</p>
        </div>
      </section>

      <section className='mb-6'>
        <h2 className='text-xl font-semibold mb-3'>المميزات</h2>
        <ul className='list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400'>
          <li>إدارة المخزون</li>
          <li>إدارة العملاء والموردين</li>
          <li>إدارة الفواتير</li>
          <li>إدارة العمال والحضور</li>
          <li>إدارة الخزينة</li>
          <li>التقارير والإحصائيات</li>
        </ul>
      </section>
    </div>
  )
}
