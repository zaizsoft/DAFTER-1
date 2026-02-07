
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// هذا الملف هو نقطة الانطلاق الرئيسية للتطبيق
// يقوم باستدعاء المكون App من ملف App.tsx الذي يحتوي على منطق شاشة الترحيب والواجهة الرئيسية
const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
