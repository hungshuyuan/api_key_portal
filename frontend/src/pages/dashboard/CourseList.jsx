// src/pages/dashboard/CourseList.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../AuthProvider';
import '../../../css/pages.css';

// 1. 後端 API 基礎網址設定
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://www.iai.nkust.edu.tw/iaibackend';

const FUNCTION_TABS = [
  { key: 'course-management', label: '課程管理' },
  { key: 'upload-roster', label: '上傳修課名單' },
  { key: 'quota-management', label: '配額管理' }
];

function CourseList() {
  // ==========================================
  // 全局核心狀態
  // ==========================================
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [activeTab, setActiveTab] = useState('course-management');
  const [courses, setCourses] = useState([]);
  
  // 學生名單與課程資訊狀態
  const [studentsData, setStudentsData] = useState([]);
  const [courseInfo, setCourseInfo] = useState(null);
  const [globalLoading, setGlobalLoading] = useState(false);
  const [globalError, setGlobalError] = useState('');

  // ==========================================
  // 狀態組：上傳修課名單專用 (Upload View State)
  // ==========================================
  const [uploadCourseId, setUploadCourseId] = useState('');
  const [uploadCourseName, setUploadCourseName] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadStep, setUploadStep] = useState(1); // 1: 上傳 2: 設額度 3: 完成
  const [uploadBudget, setUploadBudget] = useState('');
  const [uploadStatus, setUploadStatus] = useState('');
  const [uploadLoading, setUploadLoading] = useState(false);
  
  const { accessToken, token } = useAuth(); 
  
  const currentToken = accessToken || token || localStorage.getItem('access_token');
  console.log("🔍 目前準備發送的 Token 是:", currentToken);
  const authHeaders = currentToken ? { 'Authorization': `Bearer ${currentToken}` } : {};

  // ==========================================
  // 🌟 API 功能 0：初始化載入老師的真實課程清單
  // ==========================================
  useEffect(() => {
  const fetchCourses = async () => {
    try {
      // 🌟 網址乾乾淨淨，完全不帶任何老師名字參數！
      const res = await fetch(`${API_BASE_URL}/api/courses/teacher/courses`, {
        method: 'GET',
        headers: { 
          'Accept': 'application/json', 
          ...authHeaders // 🌟 只要確保這個有帶上 Token，後端就會自己識別是誰
        },
        credentials: 'include'
      });

      if (!res.ok) throw new Error('無法取得課程列表');
      const data = await res.json();
      
      if (data.courses && data.courses.length > 0) {
        setCourses(data.courses);
        setSelectedCourseId(data.courses[0].id); 
      } else {
        setCourses([]);
      }
    } catch (err) {
      setGlobalError("無法連線至資料庫取得課程清單");
      console.error(err);
    }
  };

  fetchCourses();
}, []);

  // ==========================================
  // 副作用監聽：切換課程或 Tab 時自動查詢
  // ==========================================
  useEffect(() => {
    if (activeTab === 'course-management' || activeTab === 'quota-management') {
      handleSearchList(selectedCourseId);
    }
  }, [selectedCourseId, activeTab]);

  useEffect(() => {
    if (uploadStep === 1) {
      setUploadCourseId(selectedCourseId);
      const current = courses.find(c => c.id === selectedCourseId)
      setUploadCourseName(current ? current.name : '');
    }
  }, [selectedCourseId, uploadStep]);

  // ==========================================
  // API 功能 1：查詢該課程的所有學生用量 (GET)
  // ==========================================
  const handleSearchList = async (courseId) => {
    if (!courseId) return;
    setGlobalLoading(true);
    setGlobalError('');
    setStudentsData([]);
    setCourseInfo(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/courses/keys/list?course_id=${courseId}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json', ...authHeaders },
        credentials: 'include'
      });

      if (!res.ok) {
        let errMsg = '找不到該課程或無法取得資料';
        try {
          const errData = await res.json();
          errMsg = errData.detail || errData.message || errMsg;
        } catch(e) {}
        throw new Error(errMsg);
      }

      const data = await res.json();

      if (data.course_info) {
        setCourseInfo({
          max_budget: data.course_info.max_budget || 0,
          course_total_spend: data.course_info.course_total_spend || 0,
        });
      }

      if (data.keys && Array.isArray(data.keys)) {
        const formattedStudents = data.keys.map(item => {
          const studentId = item.key_alias ? item.key_alias.split('_')[0] : '未知學號';
          return {
            studentID: studentId,
            spend: item.spend || 0,
            max_budget: item.max_budget || 0,
            key_alias: item.key_alias,
            key_name: item.key_name,
            name: item.student_name || '同學' 
          };
        });

        formattedStudents.sort((a, b) => a.studentID.localeCompare(b.studentID));
        setStudentsData(formattedStudents);
      } else {
        setStudentsData([]);
      }
    } catch (err) {
      setGlobalError(err.message);
    } finally {
      setGlobalLoading(false);
    }
  };

  // ==========================================
  // API 功能 2：上傳名單表單提交 (POST)
  // ==========================================
  const handleUploadRoster = async (e) => {
    e.preventDefault();
    if (!uploadCourseId || !uploadCourseName || !uploadFile) {
      return alert('請填寫完整資訊並選擇檔案');
    }

    setUploadLoading(true);
    setUploadStatus('正在建立課程與上傳名單...');

    const formData = new FormData();
    formData.append('courseID', uploadCourseId);
    formData.append('courseName', uploadCourseName);
    formData.append('students', uploadFile);

    try {
      const res = await fetch(`${API_BASE_URL}/api/courses/new`, {
        method: 'POST',
        headers: { 'Accept': 'application/json', ...authHeaders },
        credentials: 'include',
        body: formData
      });

      if (!res.ok) {
        let errorMsg = `HTTP 錯誤 ${res.status}`;
        try {
          const errData = await res.json();
          const detail = errData?.detail ?? errData?.error ?? errData;
          errorMsg = typeof detail === 'string' ? detail : JSON.stringify(detail) || errorMsg;
        } catch (parseErr) {
          errorMsg = `伺服器回傳了非預期的格式 (狀態碼: ${res.status})`;
        }

        console.log("🚨 準備攔截 - 狀態碼:", res.status, "內容:", errorMsg);

        if (res.status === 400 || (typeof errorMsg === 'string' && (errorMsg.includes('已存在') || errorMsg.includes('UNIQUE constraint failed')))) {
          const confirmSkip = window.confirm(`⚠️ 課程 ${uploadCourseId} 已經建立過了！\n\n請問要直接跳到「設定額度與派發金鑰」的步驟嗎？`);
          if (confirmSkip) {
              setUploadStep(2);
              setUploadStatus(`已跳轉至課程 ${uploadCourseId} 的金鑰派發設定。`);
              return;
          }
        }
        throw new Error(errorMsg);
      }

      const data = await res.json();
      setUploadStatus(`✅ 成功！已寫入 ${data.students_count || 0} 位學生。請繼續設定每位學生的初始 API 額度。`);
      setUploadStep(2);

    } catch (err) {
      setUploadStatus(`❌ 發生錯誤: ${err.message}`);
      console.error("上傳失敗細節:", err);
    } finally {
      setUploadLoading(false);
    }
  };

  // ==========================================
  // API 功能 3：派發初始金鑰與額度 (POST)
  // ==========================================
  const handleGenerateKeys = async () => {
    if (!uploadBudget || uploadBudget <= 0) return alert('請輸入有效的額度金額');
    setUploadLoading(true);
    setUploadStatus('正在為全班產生 API Key...');

    try {
      const res = await fetch(`${API_BASE_URL}/api/courses/keys/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        credentials: 'include',
        body: JSON.stringify({
          courseID: uploadCourseId,
          budget: parseFloat(uploadBudget)
        })
      });

      const data = await res.json();
      if (res.ok) {
        setUploadStatus(`✅ 成功！已為課程 ${data.courseID} 產生共 ${data.keys ? data.keys.length : 0} 把金鑰。`);
        setUploadStep(3);
        handleSearchList(uploadCourseId);
      } else {
        throw new Error(data.detail || '產生金鑰失敗');
      }
    } catch (err) {
      setUploadStatus(`❌ 發生錯誤: ${err.message}`);
    } finally {
      setUploadLoading(false);
    }
  };

  // ==========================================
  // API 功能 4：獨立更新某位學生的額度 (POST)
  // ==========================================
  const handleUpdateSingleBudget = async (studentID, currentBudget, keyAlias) => {
    const newBudget = prompt(`請輸入學號 ${studentID} 的新額度 (USD):`, currentBudget);
    if (newBudget === null || newBudget === "") return;

    const parsedBudget = parseFloat(newBudget);

    if (courseInfo && courseInfo.max_budget) {
      if (parsedBudget > courseInfo.max_budget) {
        alert(`修改失敗：輸入金額已超過本課程的額度上限 (${courseInfo.max_budget} USD)！`);
        return;
      }
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/courses/keys/update_budget`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        credentials: 'include',
        body: JSON.stringify({
          updateBudget: parsedBudget,
          key_alias: keyAlias
        })
      });

      const result = await res.json();
      if (res.ok) {
        alert('更新成功！');
        handleSearchList(selectedCourseId); 
      } else {
        alert(`更新失敗: ${JSON.stringify(result.detail, null, 2)}`);
      }
    } catch (err) {
      alert(`發生錯誤: ${err.message}`);
    }
  };

  const currentCourseObj = courses.find(c => c.id === selectedCourseId);

  // ==========================================
  // 畫面渲染區塊 (已完美修正 UI 排版)
  // ==========================================
  return (
    <div className="page-container" style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: '#f9fafb' }}>
      
      {/* 頂部標頭與提示控制 */}
      <div className="page-header page-header-with-controls" 
     style={{ padding: '20px 20px 0 20px', backgroundColor: '#f9fafb', color: '#111827' }}>
        <div>
          <h1>課程控制台</h1>
          <p className="page-subtitle">切換下拉選單切換課程，並使用下方分頁完成管理工作。</p>
        </div>
      </div>

      {/* 控制面板：整合下拉選單與 Tabs 按鈕 */}
      <div className="course-control-panel" style={{ padding: '0 20px', backgroundColor: '#f9fafb' }}>
        <div className="field-group">
          <label htmlFor="course-select">選擇課程</label>
          <select
            id="course-select"
            className="select-control"
            value={selectedCourseId}
            onChange={(event) => setSelectedCourseId(event.target.value)}
          >
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.id} - {course.name}
              </option>
            ))}
          </select>
        </div>

        <div className="function-tabs">
          {FUNCTION_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`tab-button ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '0 20px' }}>
        {globalLoading && (activeTab === 'course-management' || activeTab === 'quota-management') && (
          <div style={{ color: '#3b82f6', padding: '10px 0', fontSize: '14px' }}>🔄 正在向後端查詢資料...</div>
        )}
        {globalError && (activeTab === 'course-management' || activeTab === 'quota-management') && (
          <div style={{ color: '#ef4444', padding: '10px 0', fontSize: '14px' }}>⚠️ 錯誤: {globalError}</div>
        )}
      </div>

      {/* ==========================================
          功能分頁 1：[課程管理] 學生 API 用量列表
          ========================================== */}
      {activeTab === 'course-management' && (
        <div className="page-content" style={{ flex: 1, overflowY: 'auto', backgroundColor: '#ffffff', color: '#111827', padding: '20px' }}>
          <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2>{currentCourseObj ? currentCourseObj.name : '未知課程'} ({selectedCourseId})</h2>
              <p>當前選定班級之全體修課學生名單與 API 花費用量總覽</p>
            </div>
            <button 
              onClick={() => handleSearchList(selectedCourseId)} 
              style={{ padding: '6px 12px', background: '#27272a', border: '1px solid #3f3f46', color: '#fff', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}
            >
              刷新資料
            </button>
          </div>

          <div className="table-scroll-wrapper">
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                  <th style={{ textAlign: 'left', padding: '12px' }}>學號</th>
                  <th style={{ textAlign: 'left', padding: '12px' }}>姓名</th>
                  <th style={{ textAlign: 'left', padding: '12px' }}>已用量 / 總額度 (USD)</th>
                  <th style={{ textAlign: 'left', padding: '12px', width: '30%' }}>視覺化用量進度</th>
                  <th style={{ textAlign: 'left', padding: '12px' }}>修改額度</th>
                </tr>
              </thead>
              <tbody>
              {studentsData.length === 0 ? (
                <tr><td colSpan="4" style={{ textAlign: 'center', color: '#71717a', padding: '30px' }}>此課程目前無學生資料或查詢失敗</td></tr>
              ) : (
                studentsData.map((student) => {
                  const percent = student.max_budget > 0 
                    ? Math.min((student.spend / student.max_budget) * 100, 100).toFixed(1) 
                    : 0;
                  const isDangerous = percent >= 90;

                  return (
                    <tr key={student.studentID} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '12px', color: '#000000', backgroundColor: 'transparent' }}>
                        <strong>{student.studentID}</strong>
                      </td>
                      <td style={{ padding: '12px', color: '#000000', backgroundColor: 'transparent' }}>
                        {student.name}
                      </td>
                      <td style={{ padding: '12px', backgroundColor: 'transparent' }}>
                        <span style={{ color: '#000000', fontWeight: 'bold' }}>${Number(student.spend).toFixed(4)}</span>
                        <span style={{ color: '#6b7280' }}> / ${Number(student.max_budget).toFixed(2)}</span>
                      </td>
                      <td style={{ padding: '12px', backgroundColor: 'transparent' }}>
                        <div style={{ width: '100%', backgroundColor: '#e5e7eb', borderRadius: '4px', height: '10px', overflow: 'hidden', marginTop: '6px' }}>
                          <div style={{ 
                            width: `${percent}%`, 
                            backgroundColor: isDangerous ? '#ef4444' : '#4ade80', 
                            height: '100%',
                            transition: 'width 0.4s ease-in-out'
                          }}></div>
                        </div>
                        <span style={{ fontSize: '11px', color: isDangerous ? '#ef4444' : '#6b7280', marginTop: '4px', display: 'block' }}>
                          已消耗 {percent}%
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==========================================
          功能分頁 2：[上傳修課名單] 
          ========================================== */}
      {activeTab === 'upload-roster' && (
        <div className="page-content" style={{ flex: 1, overflowY: 'auto', backgroundColor: '#ffffff', color: '#111827', padding: '20px' }}>
          <div className="section-header">
            <h2 style={{ color: '#111827' }}>建立新班級名單與派發金鑰流程</h2>
            <p style={{ color: '#6b7280' }}>請上傳名單檔案以寫入資料庫，並設定全班每位同學的初始使用額度上限。</p>
          </div>

          <div style={{ border: '1px solid #e5e7eb', padding: '30px', borderRadius: '12px', backgroundColor: '#ffffff', color: '#111827', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            {uploadStep === 1 && (
              <form onSubmit={handleUploadRoster} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ color: '#111827', fontSize: '14px', fontWeight: 'bold' }}>課程代碼 (Course ID)</label>
                  <input type="text" placeholder="請輸入課號 (如: CS101)" value={uploadCourseId} onChange={e => setUploadCourseId(e.target.value)} required style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#ffffff', border: '1px solid #d1d5db', color: '#111827', outline: 'none' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ color: '#111827', fontSize: '14px', fontWeight: 'bold' }}>課程名稱 (Course Name)</label>
                  <input type="text" placeholder="請輸入課程中文名稱" value={uploadCourseName} onChange={e => setUploadCourseName(e.target.value)} required style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#ffffff', border: '1px solid #d1d5db', color: '#111827', outline: 'none' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ color: '#111827', fontSize: '14px', fontWeight: 'bold' }}>選擇 XML 學生名單檔案</label>
                  <input type="file" accept=".xml" onChange={e => setUploadFile(e.target.files[0])} required style={{ color: '#111827', padding: '10px 0', backgroundColor: '#ffffff' }} />
                </div>
                <button type="submit" disabled={uploadLoading} style={{ padding: '12px', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', marginTop: '10px' }}>
                  {uploadLoading ? '正在處理中...' : '送出並建立課程'}
                </button>
              </form>
            )}

            {uploadStep === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <h3 style={{ color: '#111827' }}>為學生設定統一 API 額度</h3>
                <p style={{ color: '#6b7280' }}>課程 <strong style={{ color: '#111827' }}>{uploadCourseName} ({uploadCourseId})</strong> 已建立。請輸入每位學生可獲得的初始 API 額度 (USD)。</p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ color: '#111827', fontWeight: 'bold' }}>每位學生額度 (USD)</label>
                  <input type="number" step="0.01" value={uploadBudget} onChange={e => setUploadBudget(e.target.value)} style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#ffffff', border: '1px solid #d1d5db', color: '#111827', outline: 'none' }} />
                </div>
                <button onClick={handleGenerateKeys} disabled={uploadLoading} style={{ padding: '12px', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', marginTop: '10px' }}>
                  {uploadLoading ? '產生中...' : '確認並派發 API Key'}
                </button>
              </div>
            )}

            {uploadStep === 3 && (
              <div style={{ textAlign: 'center', padding: '30px 0' }}>
                <h3 style={{ color: '#10b981', fontSize: '24px', marginBottom: '15px' }}>🎉 流程完成！</h3>
                <button onClick={() => { setUploadStep(1); setUploadFile(null); setUploadStatus(''); }} style={{ padding: '12px 24px', backgroundColor: '#f3f4f6', color: '#111827', border: '1px solid #d1d5db', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                  建立下一堂課
                </button>
              </div>
            )}

            {uploadStatus && (
              <div style={{ marginTop: '20px', padding: '15px', borderRadius: '8px', fontSize: '14px', backgroundColor: uploadStatus.includes('✅') ? '#d1fae5' : '#fee2e2', color: uploadStatus.includes('✅') ? '#065f46' : '#991b1b', border: `1px solid ${uploadStatus.includes('✅') ? '#34d399' : '#f87171'}` }}>
                {uploadStatus}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==========================================
          功能分頁 3：[配額管理] 
          ========================================== */}
      {activeTab === 'quota-management' && (
        <div className="page-content" style={{ flex: 1, overflowY: 'auto', backgroundColor: '#ffffff', color: '#111827', padding: '20px' }}>
          <div className="section-header">
            <h2>學生 API 額度限制調整</h2>
            <p>監控每位學生的預算比例。可點擊「修改額度」進行個別追減。</p>
          </div>

          <div className="table-scroll-wrapper">
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                  <th style={{ textAlign: 'left', padding: '12px' }}>學號</th>
                  <th style={{ textAlign: 'left', padding: '12px' }}>已用量 / 總預算</th>
                  <th style={{ textAlign: 'left', padding: '12px' }}>用量進度比例</th>
                  <th style={{ textAlign: 'left', padding: '12px' }}>操作</th>
                </tr>
              </thead>
              <tbody>
              {studentsData.length === 0 ? (
                <tr><td colSpan="4" style={{ textAlign: 'center', color: '#71717a', padding: '30px' }}>本課程暫無學生配額數據</td></tr>
              ) : (
                studentsData.map((s) => {
                  const percent = s.max_budget > 0 ? Math.min((s.spend / s.max_budget) * 100, 100).toFixed(1) : 0;
                  const isDangerous = percent >= 90;

                  return (
                    <tr key={s.studentID} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '12px', color: '#000000', backgroundColor: 'transparent' }}>
                        <strong>{s.studentID}</strong>
                      </td>
                      <td style={{ padding: '12px', backgroundColor: 'transparent' }}>
                        <span style={{ color: '#000000' }}>${Number(s.spend).toFixed(2)}</span>
                        <span style={{ color: '#6b7280' }}> / ${Number(s.max_budget).toFixed(2)}</span>
                      </td>
                      <td style={{ padding: '12px', width: '25%', backgroundColor: 'transparent' }}>
                        <div style={{ width: '100%', backgroundColor: '#e5e7eb', borderRadius: '4px', height: '10px', overflow: 'hidden', marginTop: '6px' }}>
                          <div style={{ width: `${percent}%`, backgroundColor: isDangerous ? '#ef4444' : '#3b82f6', height: '100%', transition: 'width 0.4s ease-in-out' }}></div>
                        </div>
                      </td>
                      <td style={{ padding: '12px', backgroundColor: 'transparent' }}>
                        <button 
                          onClick={() => handleUpdateSingleBudget(s.studentID, s.max_budget, s.key_alias)} 
                          style={{ padding: '6px 12px', backgroundColor: '#f3f4f6', color: '#111827', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}
                        >
                          修改額度
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default CourseList;