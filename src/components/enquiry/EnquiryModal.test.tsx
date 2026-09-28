import { beforeAll, describe, expect, test } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MotionGlobalConfig } from "framer-motion";
import { EnquiryButton, EnquiryModalProvider } from "./EnquiryModal";

beforeAll(() => {
  MotionGlobalConfig.skipAnimations = true;
});

const courses = [
  { id: "c_tally", slug: "tally-erp", titleEn: "Tally ERP 9", titleMl: null },
  { id: "c_py", slug: "python", titleEn: "Python Programming", titleMl: null },
];

function renderWithButton(props: { courseId?: string; courseSlug?: string }) {
  return render(
    <EnquiryModalProvider courses={courses}>
      <EnquiryButton source="test" {...props}>
        Enroll Now
      </EnquiryButton>
    </EnquiryModalProvider>,
  );
}

describe("EnquiryModal", () => {
  test("preselects the course passed by slug", () => {
    renderWithButton({ courseSlug: "python" });
    fireEvent.click(screen.getByRole("button", { name: "Enroll Now" }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByLabelText("Course interested in")).toHaveValue("c_py");
  });

  test("opens with no course selected by default and closes on Escape", async () => {
    renderWithButton({});
    fireEvent.click(screen.getByRole("button", { name: "Enroll Now" }));
    expect(screen.getByLabelText("Course interested in")).toHaveValue("");

    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });

  test("the close button closes the modal", async () => {
    renderWithButton({ courseId: "c_tally" });
    fireEvent.click(screen.getByRole("button", { name: "Enroll Now" }));
    fireEvent.click(
      screen.getByRole("button", { name: /close enquiry form/i }),
    );
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });
});
