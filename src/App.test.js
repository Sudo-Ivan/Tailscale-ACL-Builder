import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders flow controls", () => {
  render(<App />);
  const addSourceButton = screen.getByText(/Add source/i);
  expect(addSourceButton).toBeInTheDocument();
});
