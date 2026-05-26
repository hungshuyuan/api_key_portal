import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, API_BASE_URL } from './AuthProvider';

// ✅ 白名單與權限判斷（寫死在這裡）
const ALLOWED_STUDENT_IDS = ['C113118212', 'F114118119', 'C111118243'];

const hasAccess = (user) => {
    if (!user) return false;
    const role = user.role || '';
    const studentId = (user.student_id || user.nkust_account || '').toUpperCase();
    if (role === '老師' && studentId === 'C111118243') return true;
    if (ALLOWED_STUDENT_IDS.includes(studentId)) return true;
    return false;
};

export default function Check() {
    const { user, loading: authLoading, refreshUserStatus, logout } = useAuth();

    const [localUser, setLocalUser] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [agreements, setAgreements] = useState({
        usage: false,
        generation: false,
        ip: false,
        interruption: false,
        overall: false
    });

    const navigate = useNavigate();

    const handleLogout = async (e) => {
        e.preventDefault();
        if (logout) await logout();
        navigate('/');
    };

    // ✅ 統一的放行函式，加入權限判斷
    const proceedToDashboard = async (userToCheck) => {
        if (hasAccess(userToCheck)) {
            navigate('/app/apikey');
        } else {
            alert('您的帳號目前尚未開放iAI系統存取權限。\n如有疑問請洽電子計算機中心。\n按下確認登出');
            await logout();
            navigate('/');
        }
    };

    useEffect(() => {
        if (authLoading) return;

        let isMounted = true;

        const verifyStatus = async () => {
            try {
                if (user?.tos_agreed) {
                    proceedToDashboard(user);
                    return;
                }

                const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
                    credentials: 'include'
                });

                if (!isMounted) return;
                if (!response.ok) { navigate('/'); return; }

                const data = await response.json();

                if (data.logged_in && data.user) {
                    if (data.user.tos_agreed) {
                        proceedToDashboard(data.user);
                    } else {
                        setLocalUser(data.user);
                    }
                } else {
                    navigate('/');
                }
            } catch (err) {
                console.error('連線異常:', err);
                if (isMounted) navigate('/');
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        verifyStatus();
        return () => { isMounted = false; };
    }, [authLoading]);

    const handleCheckboxChange = (e) => {
        const { name, checked } = e.target;
        if (name === 'selectAll') {
            setAgreements({
                usage: checked, generation: checked,
                ip: checked, interruption: checked, overall: checked
            });
        } else {
            setAgreements(prev => ({ ...prev, [name]: checked }));
        }
    };

    const isAllAgreed = Object.values(agreements).every(v => v === true);
    const isSelectAll = isAllAgreed;

    const handleAgree = async () => {
        if (!isAllAgreed || !localUser) return;
        setIsSubmitting(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/agree-tos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ email: localUser.email })
            });
            const result = await response.json();
            if (response.ok && result.status === 'success') {
                if (refreshUserStatus) await refreshUserStatus();
                proceedToDashboard(localUser); // ✅ 傳入 localUser 做權限判斷
            } else {
                alert('系統錯誤，無法記錄您的同意狀態，請重試！');
            }
        } catch (error) {
            console.error('提交同意發生錯誤:', error);
            alert('伺服器連線失敗，請稍後再試。');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDecline = () => {
        alert('您必須同意服務條款才能使用本系統。您可以隨時登出或再次考慮。');
    };

    if (authLoading || loading || !localUser) {
        return (
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                height: '100vh', backgroundColor: '#f8f9fa', gap: '12px'
            }}>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                <div style={{
                    width: '28px', height: '28px',
                    border: '3px solid #dee2e6', borderTopColor: '#0d6efd',
                    borderRadius: '50%', animation: 'spin 0.75s linear infinite'
                }} />
                <span style={{ color: '#6c757d', fontSize: '15px' }}>正在確認權限與狀態...</span>
            </div>
        );
    }

    return (
        <div style={{
            minHeight: '100vh', backgroundColor: '#f8f9fa',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '40px 16px', boxSizing: 'border-box'
        }}>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <div style={{ width: '100%', maxWidth: '520px' }}>
                <div style={{
                    backgroundColor: '#fff', borderRadius: '12px',
                    boxShadow: '0 4px 24px rgba(0,0,0,0.1)', overflow: 'hidden'
                }}>
                    {/* 標題列 */}
                    <div style={{
                        backgroundColor: '#212529', color: '#fff',
                        textAlign: 'center', padding: '18px 24px'
                    }}>
                        <h4 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
                            服務條款與隱私權政策
                        </h4>
                    </div>

                    <div style={{ padding: '28px 24px' }}>
                        {/* 登入身分 */}
                        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                            <p style={{ margin: '0 0 4px', color: '#6c757d', fontSize: '13px' }}>目前登入身分</p>
                            <strong style={{ color: '#0d6efd', fontSize: '15px' }}>{localUser.email}</strong>
                        </div>

                        {/* 條款內容 */}
                        <div style={{
                            backgroundColor: '#f8f9fa', border: '1px solid #dee2e6',
                            borderRadius: '8px', padding: '16px', height: '300px',
                            overflowY: 'auto', fontSize: '0.875rem', lineHeight: '1.7',
                            color: '#333', marginBottom: '20px'
                        }}>
                            <h5 style={{ textAlign: 'center', marginBottom: '4px', fontSize: '15px', fontWeight: 700 }}>
                                「高科 iAI」服務條款（Terms of Service）
                            </h5>
                            <p style={{ textAlign: 'center', fontSize: '12px', color: '#6c757d', marginBottom: '12px' }}>
                                發布單位：國立高雄科技大學 電子計算機中心 ｜ 版本日期：2026 年 05 月修訂版
                            </p>
                            <p>歡迎使用「高科 iAI」服務（以下簡稱「本服務」）。本服務由國立高雄科技大學電子計算機中心（以下簡稱「本中心」）負責建置、營運與維護。</p>
                            <p>為保障您的權益，並確保智慧校園 GPU 算力及 API 資源之合理分配，所有具備本校單一登入（SSO）權限之教職員工生（以下簡稱「使用者」），於初次登入、啟用或以任何方式使用本服務（包括但不限於 Web 網頁端、API 串接等）時，即視為已閱讀、理解並同意接受本服務條款之所有內容。</p>
                            <div style={{
                                backgroundColor: '#fff3cd', border: '1px solid #ffc107',
                                borderRadius: '6px', padding: '10px 14px', margin: '12px 0',
                                fontSize: '0.85rem', color: '#856404'
                            }}>
                                ⚠️ <strong>重要提示：</strong>若您不同意本條款之任何部分，請立即停止使用本服務。
                            </div>
                            <hr style={{ borderColor: '#dee2e6', margin: '12px 0' }} />

                            <h4 style={{ fontWeight: 700, marginTop: '12px' }}>第一條：服務宗旨與資源定位</h4>
                            <p>本服務旨在提供全校普惠之生成式人工智慧（Generative AI）算力設施，將 GPU 資源轉化為校園教學與學術研究之基礎工具。</p>
                            <p>本服務所提供之 API 額度、算力及模型存取權限，均屬於學校公共學術資源，使用者應基於誠信原則合理使用，不得惡意霸佔、囤積或浪費算力。</p>

                            <h4 style={{ fontWeight: 700, marginTop: '12px' }}>第二條：校園限定與嚴禁商業使用</h4>
                            <p><strong>使用目的限制：</strong>本服務僅限用於本校之「課堂教學」、「學生作業與專題練習」、「教職員學術研究」以及「校務行政效率提升之開發測試」等非商業性用途。</p>
                            <p><strong>嚴禁商業營利：</strong>使用者嚴禁利用本服務之算力、API 或生成內容進行任何形式的商業營利行為。前述行為包括但不限於：</p>
                            <ul style={{ paddingLeft: '20px' }}>
                                <li>將本服務之 API 轉售、分發或出租予第三方。</li>
                                <li>利用本服務開發具商業收費性質之產品、軟體或服務。</li>
                                <li>未經學校書面核准，私自將本服務算力用於外部產學商務專案或商業外包接案。</li>
                            </ul>
                            <p><strong>違規處理：</strong>若經本中心偵測或遭人檢舉有商業使用之實，本中心有權在不經事先通知的情況下，永久終止該使用者之帳號權限及 API Key，並追繳其因不當使用所消耗之算力等值費用，情節重大者將移送校方依校規或法律處理。</p>

                            <h4 style={{ fontWeight: 700, marginTop: '12px' }}>第三條：生成內容非本校立場聲明</h4>
                            <p><strong>模型演算本質：</strong>本服務所串接或託管之各類型大型語言模型（LLM）及生成式模型，其輸出之內容（包含但不限於文字、程式碼、圖片、語音等，以下簡稱「生成內容」），係由底層演算法根據使用者輸入之提示詞（Prompt）自動演算產生。</p>
                            <p><strong style={{ color: '#dc3545' }}>非本校立場：</strong>所有生成內容均不代表本校、本中心或任何行政單位之觀點、立場、政策或認同。</p>
                            <p><strong>能力侷限免責：</strong>使用者理解並同意，人工智慧模型具有「幻覺（Hallucination）」、資訊滯後或產生偏見之技術侷限性。生成內容可能包含錯誤、虛構、不完整或具誤導性之資訊。使用者應具備獨立思辨能力，自行對生成內容之正確性、完整性及實用性進行核實與評估，本中心不對生成內容之準確性負任何擔保責任。</p>

                            <h4 style={{ fontWeight: 700, marginTop: '12px' }}>第四條：智慧財產權與著作權免責聲明</h4>
                            <p><strong>著作權歸屬：</strong>關於使用本服務所產生之生成內容，其著作權之歸屬、受保護之可能性及合理使用範圍，應依中華民國法律、相關國際條約及底層模型供應商（如 Mistral、NVIDIA 等）之原始授權條款認定。</p>
                            <p><strong style={{ color: '#dc3545' }}>第三方侵權免責：</strong>使用者應確保其輸入之提示詞未侵害他人之權益。若因使用者輸入之內容或本服務之生成內容，導致侵害任何第三方之智慧財產權（包括但不限於專利權、商標權、著作權、營業秘密等）或隱私權，其引發之所有法律責任與賠償損失，均由該使用者自行承擔，本校及本中心不負任何共同、連帶或法律賠償責任。</p>
                            <p><strong>學術倫理規範：</strong>使用者利用本服務協助撰寫學術論文、研究報告或課程作業時，應嚴格遵守本校及教育部之學術倫理規範，並主動且誠實地揭露人工智慧工具之使用範圍與方法。若因未揭露或過度依賴而導致抄襲、舞弊等學術倫理爭議，由使用者自行負責。</p>

                            <h4 style={{ fontWeight: 700, marginTop: '12px' }}>第五條：服務中斷與資料毀損免責聲明</h4>
                            <p><strong>服務可用性：</strong>本服務屬於實驗性及學術性之校園基礎設施，本中心雖將盡力維持系統之穩定營運，但不保證本服務絕不中斷、及時提供、安全可靠或毫無錯誤。</p>
                            <p><strong>允許中斷事由：</strong>使用者同意本中心得因以下事由，暫停、限制或中斷全部或部分服務，且不負事先通知之義務：</p>
                            <ul style={{ paddingLeft: '20px' }}>
                                <li>本中心電力系統異常、停電或高負載電力調度。</li>
                                <li>硬體設備（如 GPU 伺服器、網路交換器）突發性故障、損壞。</li>
                                <li>系統進行例行性、緊急性之維護、升級或軟體改版。</li>
                                <li>網路壅塞、遭受惡意網路攻擊（如 DDoS）或第三方 API 服務端變更。</li>
                                <li>天災、戰亂等不可抗力之因素。</li>
                            </ul>
                            <p><strong style={{ color: '#dc3545' }}>損失免責：</strong>本中心不因服務之中斷、暫停、算力延遲、傳輸失敗、或因系統故障導致之提示詞、對話紀錄、程式碼等資料之遺失、毀損，對使用者負擔任何形式之賠償或補償責任。使用者應自行對重要研究資料、原始碼或對話紀錄進行即時備份。</p>

                            <h4 style={{ fontWeight: 700, marginTop: '12px' }}>第六條：使用者禁止行為與安全規範</h4>
                            <p>使用者在使用本服務時，嚴禁從事以下行為：</p>
                            <ul style={{ paddingLeft: '20px' }}>
                                <li><strong>機敏資料輸入：</strong>嚴禁將涉及國家機密、國防安全、未公開之產學機密、他人個人隱私資料（如身份證號、病歷、金融帳號）或任何依法受保護之機密資訊輸入模型。</li>
                                <li><strong>惡意技術攻擊：</strong>禁止對本服務之 API 進行惡意壓力測試、注入式攻擊（Prompt Injection）、逆向工程，或任何意圖癱瘓、破解系統安全防護之行為。</li>
                                <li><strong>不當內容生成：</strong>禁止利用本服務生成、傳播或儲存違反中華民國法律、危害公共秩序、善良風俗、宣揚暴力、色情、仇恨言論、歧視或虛假新聞之內容。</li>
                                <li><strong>帳號安全維護：</strong>使用者應妥善保管本校 SSO 單一登入帳號密碼及本服務所核發之 API Key，嚴禁將帳號或 API 權限轉借、洩漏或分享予非本校師生之第三方使用。因保管不當導致之額度超額或法律責任，由該帳號持有者負責。</li>
                            </ul>

                            <h4 style={{ fontWeight: 700, marginTop: '12px' }}>第七條：條款修訂與通知</h4>
                            <p>本中心保有隨時修改、變更或終止本服務條款之權利。條款修訂後，本中心將於本服務官方網站或登入頁面進行公告，不另行對使用者進行個別通知。使用者於條款修訂公告後繼續使用本服務，即視為已閱讀、理解並同意接受該修訂後之條款。</p>

                            <h4 style={{ fontWeight: 700, marginTop: '12px' }}>第八條：管轄法院</h4>
                            <p>本服務條款之解釋、效力及履行，均以中華民國法律為準據法。因本服務或本條款所引發之任何爭議、訴訟，使用者同意以臺灣高雄地方法院為第一審管轄法院。</p>
                        </div>

                        {/* 勾選區 */}
                        <div style={{ marginBottom: '20px' }}>
                            <p style={{ fontSize: '13px', fontWeight: 700, color: '#0d6efd', marginBottom: '12px' }}>
                                📥 使用者確認與同意勾選（請在開始使用前完成勾選）
                            </p>
                            <label style={{
                                display: 'flex', alignItems: 'flex-start', gap: '10px',
                                padding: '10px 12px', marginBottom: '8px', cursor: 'pointer',
                                backgroundColor: '#e9f3ff', border: '1px solid #0d6efd',
                                borderRadius: '8px', fontSize: '13px', fontWeight: 700, color: '#0d6efd'
                            }}>
                                <input
                                    type="checkbox"
                                    name="selectAll"
                                    checked={isSelectAll}
                                    onChange={handleCheckboxChange}
                                    style={{ marginTop: '2px', accentColor: '#0d6efd', flexShrink: 0 }}
                                />
                                ☑ 全部同意（勾選後自動完成下方所有項目）
                            </label>

                            <div style={{ borderTop: '1px solid #dee2e6', paddingTop: '10px' }}>
                                {[
                                    { name: 'usage', label: '【用途確認】', text: '我確認本服務僅用於校園教學、學術研究或校務行政測試。我承諾絕不將本服務之算力、API 或任何生成內容用於任何商業營利行為。' },
                                    { name: 'generation', label: '【生成免責】', text: '我理解並同意本服務之生成內容皆由人工智慧模型自動演算產生，不代表學校或電算中心之立場。我明白模型具備技術侷限性，將自行評估並對採用之結果負完全法律責任。' },
                                    { name: 'ip', label: '【智財與學倫】', text: '我承諾輸入之提示詞未侵害第三方權利。若因生成內容引發著作權或智慧財產權爭議，由我本人承擔全部法律責任；使用本服務協助學術產出時，亦將遵循學術倫理規範。' },
                                    { name: 'interruption', label: '【中斷免責】', text: '我理解本服務為實驗性學術基礎設施，電算中心不保證服務永不中斷。我同意學校不需因系統維護、電力問題、硬體故障等導致之服務中止或資料遺失承擔損害賠償責任，且我會自行備份重要資料。' },
                                    { name: 'overall', label: '【我已閱讀並同意】', text: '我已完整閱讀、理解並同意接受上述「高科 iAI 服務條款」之所有條文與安全規範。', danger: true }
                                ].map(item => (
                                    <label key={item.name} style={{
                                        display: 'flex', alignItems: 'flex-start', gap: '10px',
                                        padding: '8px 4px', marginBottom: '6px', cursor: 'pointer',
                                        fontSize: '13px', color: '#333', borderBottom: '1px dashed #eee'
                                    }}>
                                        <input
                                            type="checkbox"
                                            name={item.name}
                                            checked={agreements[item.name]}
                                            onChange={handleCheckboxChange}
                                            style={{ marginTop: '3px', accentColor: '#0d6efd', flexShrink: 0 }}
                                        />
                                        <span>
                                            <strong style={item.danger ? { color: '#dc3545' } : {}}>{item.label}</strong>
                                            {' '}{item.text}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* 按鈕區 */}
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            <button
                                onClick={handleDecline}
                                disabled={isSubmitting}
                                style={{
                                    flex: 1, padding: '10px 0', fontSize: '14px', cursor: 'pointer',
                                    backgroundColor: '#fff', color: '#6c757d',
                                    border: '1px solid #6c757d', borderRadius: '8px',
                                    opacity: isSubmitting ? 0.65 : 1
                                }}
                            >
                                不同意
                            </button>
                            <button
                                onClick={handleAgree}
                                disabled={isSubmitting || !isAllAgreed}
                                style={{
                                    flex: 1, padding: '10px 0', fontSize: '14px',
                                    cursor: isAllAgreed && !isSubmitting ? 'pointer' : 'not-allowed',
                                    backgroundColor: isAllAgreed ? '#0d6efd' : '#adb5bd',
                                    color: '#fff', border: 'none', borderRadius: '8px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                    opacity: isSubmitting ? 0.65 : 1,
                                    transition: 'background-color 0.2s'
                                }}
                            >
                                {isSubmitting ? (
                                    <>
                                        <div style={{
                                            width: '14px', height: '14px',
                                            border: '2px solid rgba(255,255,255,0.4)',
                                            borderTopColor: '#fff', borderRadius: '50%',
                                            animation: 'spin 0.75s linear infinite'
                                        }} />
                                        處理中...
                                    </>
                                ) : '我同意並開始使用 (I Agree and Accept)'}
                            </button>
                        </div>

                        {!isAllAgreed && (
                            <p style={{ textAlign: 'center', fontSize: '12px', color: '#adb5bd', marginTop: '8px', marginBottom: 0 }}>
                                ※ 需勾選上方所有項目後方可點選同意
                            </p>
                        )}

                        {/* 登出連結 */}
                       <div style={{ textAlign: 'center', marginTop: '16px' }}>
                            <a
                                href="/"
                                onClick={handleLogout}
                                style={{ color: '#dc3545', fontSize: '13px', textDecoration: 'none', cursor: 'pointer' }}
                            >
                                ← 放棄並登出系統
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}