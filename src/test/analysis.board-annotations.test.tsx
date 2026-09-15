import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import ChessBoard from '@/components/ChessBoard';
import { BoardSettingsProvider } from '@/contexts/BoardSettingsContext';
vi.mock('react-chessboard', () => ({ Chessboard: ({ areArrowsAllowed }: { areArrowsAllowed: boolean }) => <div data-testid="inner-board" data-native-arrows={String(areArrowsAllowed)} /> }));
afterEach(() => { cleanup(); vi.restoreAllMocks(); });
it('maps a right drag to annotation squares in both orientations without enabling native transient arrows', () => {
  const onAnnotationArrow = vi.fn();
  const view = render(<BoardSettingsProvider><ChessBoard size={400} interactive={false} onAnnotationArrow={onAnnotationArrow} /></BoardSettingsProvider>);
  const wrapper = screen.getByTestId('inner-board').parentElement!;
  vi.spyOn(wrapper, 'getBoundingClientRect').mockReturnValue({ left: 10, top: 20, width: 400, height: 400, right: 410, bottom: 420, x: 10, y: 20, toJSON: () => {} });
  const drag = () => { fireEvent(wrapper, new MouseEvent('pointerdown', { bubbles: true, button: 2, clientX: 235, clientY: 345 })); fireEvent(wrapper, new MouseEvent('pointerup', { bubbles: true, button: 2, clientX: 235, clientY: 245 })); };
  expect(screen.getByTestId('inner-board')).toHaveAttribute('data-native-arrows', 'false');
  drag(); expect(onAnnotationArrow).toHaveBeenLastCalledWith('e2', 'e4');
  view.rerender(<BoardSettingsProvider><ChessBoard size={400} flipped interactive={false} onAnnotationArrow={onAnnotationArrow} /></BoardSettingsProvider>);
  drag(); expect(onAnnotationArrow).toHaveBeenLastCalledWith('d7', 'd5');
});
