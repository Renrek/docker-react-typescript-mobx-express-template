import { fireEvent, render, screen } from '@testing-library/react';
import Home from './Home';

test('toggles authentication when the button is clicked', () => {
    render(<Home />);

    fireEvent.click(screen.getByRole('button', { name: 'Login' }));

    expect(screen.getByText('Logged in')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Log Out' })).toBeInTheDocument();
});
