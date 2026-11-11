import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ReadingForm from './ReadingForm.jsx';

const DATE = '2026-10-15';

// Fake fetch responses, so the real api() helper runs and turns failures into Errors
const okResponse = (status = 201) => ({ ok: true, status, json: async () => ({}) });
const errorResponse = (status, error) => ({ ok: false, status, json: async () => ({ error }) });

// What the form sent to the server: [url, method, parsed JSON body]
function sentRequest(fetchMock) {
  const [url, options] = fetchMock.mock.calls[0];
  return [url, options.method, JSON.parse(options.body)];
}

describe('ReadingForm', () => {
  let fetchMock;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });
  afterEach(() => vi.unstubAllGlobals());

  it('shows the selected date and the four time slots', () => {
    render(<ReadingForm date={DATE} editing={null} onSaved={vi.fn()} onCancel={vi.fn()} />);

    expect(screen.getByRole('heading', { name: 'Add reading for 15 Oct 2026' })).toBeInTheDocument();
    const slots = screen.getAllByRole('option').map((o) => o.textContent);
    expect(slots).toEqual(['Morning (fasting)', 'After breakfast', 'After lunch', 'After dinner']);
  });

  it('sends the reading to the API and calls onSaved', async () => {
    fetchMock.mockResolvedValue(okResponse());
    const onSaved = vi.fn();
    const user = userEvent.setup();
    render(<ReadingForm date={DATE} editing={null} onSaved={onSaved} onCancel={vi.fn()} />);

    await user.selectOptions(screen.getByLabelText('Time slot'), 'after_lunch');
    await user.type(screen.getByLabelText('Glucose (mg/dl)'), '135');
    await user.click(screen.getByRole('button', { name: 'Add reading' }));

    expect(sentRequest(fetchMock)).toEqual([
      '/api/readings',
      'POST',
      { date: DATE, slot: 'after_lunch', value: '135' },
    ]);
    expect(onSaved).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows the error message returned by the server', async () => {
    fetchMock.mockResolvedValue(errorResponse(400, 'Value must be between 40 and 600 mg/dl.'));
    const onSaved = vi.fn();
    const user = userEvent.setup();
    render(<ReadingForm date={DATE} editing={null} onSaved={onSaved} onCancel={vi.fn()} />);

    await user.type(screen.getByLabelText('Glucose (mg/dl)'), '700');
    await user.click(screen.getByRole('button', { name: 'Add reading' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Value must be between 40 and 600 mg/dl.');
    expect(onSaved).not.toHaveBeenCalled();
  });

  it('shows the "4 readings per day" error from the server', async () => {
    fetchMock.mockResolvedValue(errorResponse(409, 'You can add only 4 readings per day.'));
    const user = userEvent.setup();
    render(<ReadingForm date={DATE} editing={null} onSaved={vi.fn()} onCancel={vi.fn()} />);

    await user.type(screen.getByLabelText('Glucose (mg/dl)'), '110');
    await user.click(screen.getByRole('button', { name: 'Add reading' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('You can add only 4 readings per day.');
  });

  it('pre-fills the form when editing and updates with PUT', async () => {
    fetchMock.mockResolvedValue(okResponse(200));
    const onSaved = vi.fn();
    const editing = { id: 7, date: DATE, slot: 'after_dinner', value: 142 };
    const user = userEvent.setup();
    render(<ReadingForm date={DATE} editing={editing} onSaved={onSaved} onCancel={vi.fn()} />);

    expect(screen.getByLabelText('Time slot')).toHaveValue('after_dinner');
    expect(screen.getByLabelText('Glucose (mg/dl)')).toHaveValue(142);

    await user.clear(screen.getByLabelText('Glucose (mg/dl)'));
    await user.type(screen.getByLabelText('Glucose (mg/dl)'), '150');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(sentRequest(fetchMock)).toEqual([
      '/api/readings/7',
      'PUT',
      { date: DATE, slot: 'after_dinner', value: '150' },
    ]);
    expect(onSaved).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when Cancel is clicked while editing', async () => {
    const onCancel = vi.fn();
    const editing = { id: 7, date: DATE, slot: 'morning', value: 95 };
    const user = userEvent.setup();
    render(<ReadingForm date={DATE} editing={editing} onSaved={vi.fn()} onCancel={onCancel} />);

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
