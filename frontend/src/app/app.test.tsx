import { render, screen } from '@testing-library/react';
import { App } from './app';
import { AppProviders } from './providers';

describe('App', () => {
  it('renders the starter placeholder', () => {
    render(
      <AppProviders>
        <App />
      </AppProviders>,
    );

    expect(
      screen.getByText('Hackathon 2026 — starter pronto'),
    ).toBeInTheDocument();
    expect(screen.getByText('shadcn/ui configurado')).toBeInTheDocument();
  });
});
