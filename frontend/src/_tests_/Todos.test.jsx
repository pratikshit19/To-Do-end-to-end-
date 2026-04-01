import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Todos } from "../components/Todos";

// Mock toast
vi.mock("react-hot-toast", () => ({
  default: {
    loading: vi.fn(() => "toast-id"),
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock fetch globally
global.fetch = vi.fn();

const mockTodos = [
  {
    _id: "1",
    title: "Test Todo",
    description: "Testing task",
    completed: false,
    priority: "high",
    dueDate: new Date().toISOString(),
  },
];

describe("Todos Component", () => {
  const mockFetchTodos = vi.fn();
  const mockLogout = vi.fn();
  const mockSetCurrentPage = vi.fn();

  beforeEach(() => {
    fetch.mockClear();
  });

  it("renders todo title", () => {
    render(
      <Todos
        todos={mockTodos}
        fetchTodos={mockFetchTodos}
        onLogout={mockLogout}
        setCurrentPage={mockSetCurrentPage}
      />
    );

    expect(screen.getByText("Test Todo")).toBeInTheDocument();
  });

  it("toggles completion when checkbox clicked", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    render(
      <Todos
        todos={mockTodos}
        fetchTodos={mockFetchTodos}
        onLogout={mockLogout}
        setCurrentPage={mockSetCurrentPage}
      />
    );

    const checkbox = screen.getByRole("checkbox");
    fireEvent.click(checkbox);

    expect(fetch).toHaveBeenCalled();
  });

  it("shows empty state if no todos", () => {
    render(
      <Todos
        todos={[]}
        fetchTodos={mockFetchTodos}
        onLogout={mockLogout}
        setCurrentPage={mockSetCurrentPage}
      />
    );

    expect(screen.getByText(/No tasks here/i)).toBeInTheDocument();
  });

  it("filters to completed tasks", () => {
    const completedTodo = {
      ...mockTodos[0],
      _id: "2",
      completed: true,
      title: "Completed Task",
    };

    render(
      <Todos
        todos={[...mockTodos, completedTodo]}
        fetchTodos={mockFetchTodos}
        onLogout={mockLogout}
        setCurrentPage={mockSetCurrentPage}
      />
    );

    const completedFilter = screen.getByText("Completed");
    fireEvent.click(completedFilter);

    expect(screen.getByText("Completed Task")).toBeInTheDocument();
  });
});