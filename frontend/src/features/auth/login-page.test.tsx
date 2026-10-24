import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { LoginPage } from './login-page';

vi.mock('./auth-context', () => ({
  useAuth: () => ({
    user: null,
    login: vi.fn(),
  }),
}));

function renderLogin() {
  return render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>,
  );
}

describe('LoginPage', () => {
  it('toggles password visibility and does not expose demo credentials', () => {
    renderLogin();

    const password = screen.getByLabelText('Senha');
    expect(password).toHaveAttribute('type', 'password');

    fireEvent.click(screen.getByRole('button', { name: 'Mostrar senha' }));
    expect(password).toHaveAttribute('type', 'text');

    fireEvent.click(screen.getByRole('button', { name: 'Ocultar senha' }));
    expect(password).toHaveAttribute('type', 'password');

    expect(screen.queryByText(/demo@careflow.dev/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/demo1234/i)).not.toBeInTheDocument();
  });
});
