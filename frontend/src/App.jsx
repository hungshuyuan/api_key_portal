import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Layout from './Layout';
import Home from './Home';
import Copliot from './Copliot';
import Model from './Model';
import Tutorial from './Tutorial';
import { AuthProvider } from './AuthProvider';

function App() {

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  if (!googleClientId) {
    console.error("找不到 Google Client ID，請檢查 .env 設定！");
  }

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <AuthProvider>
        <Router basename="/portal">
          <Layout>
            <Routes>
              {/* 這裡放你實際的頁面路由 */}
              <Route path="/" element={<Home />} />
              <Route path="/copliot" element={<Copliot />} />
              <Route path="/model" element={<Model />} />
              <Route path="/tutorial" element={<Tutorial />} />
              
              {/* 防呆路由：找不到網址時顯示 */}
              <Route path="*" element={<h1 style={{ padding: '100px' }}>404 找不到頁面</h1>} />
            </Routes>
          </Layout>
        </Router>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;


// function App() {
//   return (
    
//     // <div style={{ padding: '50px', background: 'yellow' }}>
//     //   <h1 style={{ color: 'red' }}>如果能看到這行，代表 React 有成功啟動！是 AuthProvider 卡住了。</h1>
//     // </div>
//     <GoogleOAuthProvider clientId={googleClientId}>
//       <AuthProvider>
//         <Router basename="/portal">
//           <Layout>
//             <Routes>
//               {/* <Route path="/" element={<Home />} />
//               <Route path="/copliot" element={<Copliot />} />
//               <Route path="/model" element={<Model />} />
//               <Route path="/tutorial" element={<Tutorial />} /> */}
//               <h1 style={{ color: 'red' }}>我有成功渲染進 Router 喔！</h1>
//             </Routes>
//           </Layout>
//         </Router>
//       </AuthProvider> 
//     </GoogleOAuthProvider>
//   );
// }

// export default App;