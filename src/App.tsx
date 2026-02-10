import { HashRouter, Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/Layout';

import { ClientsPage } from '@/pages/ClientsPage';
import { PaymentsPage } from '@/pages/PaymentsPage';
import { PipelinePage } from '@/pages/PipelinePage';
import { CalendarPage } from '@/pages/CalendarPage';
import { DashboardPage } from '@/pages/DashboardPage';

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<DashboardPage />} />
          <Route path="clients" element={<ClientsPage />} />
          <Route path="payments" element={<PaymentsPage />} />
          <Route path="pipeline" element={<PipelinePage />} />
          <Route path="calendar" element={<CalendarPage />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}

export default App;
