import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {title:'TransitionOps | 제조 전환투자 워크스페이스',description:'설비투자의 근거 준비, 승인된 자료 공유, 금융 보완 요청을 연결하는 개인 데모.'};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="ko"><body>{children}</body></html>}
