import { PropsWithChildren } from 'react';
import { SelectedNumberProvider } from '@/contexts/SelectedNumberContext';
import { Call } from './Call';
import Header from './Header';
import Sidebar from './Sidebar';

type Props = PropsWithChildren;

const PageLayout = ({ children }: Props) => {
  return (
    <SelectedNumberProvider>
      <div className="app-shell">
        <Header />
        <Sidebar />
        <main className="main-content h-full w-full overflow-y-auto">
          <div className="main-content-full">
            <Call />
            {children}
          </div>
        </main>
      </div>
    </SelectedNumberProvider>
  );
};

export default PageLayout;
