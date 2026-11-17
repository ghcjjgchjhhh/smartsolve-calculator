import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import 'katex/dist/katex.min.css';
import { initHostingAnalytics } from './lib/firebaseAnalytics.ts';

void initHostingAnalytics();

createRoot(document.getElementById('root')!).render(<App />);
