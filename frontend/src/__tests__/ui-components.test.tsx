import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from "@/components/ui/table";

describe("UI Primitive Components", () => {
  it("renders button with various variants", () => {
    const { rerender } = render(<Button variant="default">Primary</Button>);
    expect(screen.getByRole("button", { name: "Primary" })).toHaveClass("bg-primary");

    rerender(<Button variant="destructive">Destructive</Button>);
    expect(screen.getByRole("button", { name: "Destructive" })).toHaveClass("bg-destructive");

    rerender(<Button variant="outline">Outline</Button>);
    expect(screen.getByRole("button", { name: "Outline" })).toHaveClass("border-input");
  });

  it("renders badges with semantic status colors", () => {
    const { rerender } = render(<Badge variant="success">Active</Badge>);
    expect(screen.getByText("Active")).toHaveClass("bg-emerald-50");

    rerender(<Badge variant="warning">Pending</Badge>);
    expect(screen.getByText("Pending")).toHaveClass("bg-amber-50");

    rerender(<Badge variant="danger">Failed</Badge>);
    expect(screen.getByText("Failed")).toHaveClass("bg-rose-50");

    rerender(<Badge variant="info">New</Badge>);
    expect(screen.getByText("New")).toHaveClass("bg-sky-50");
  });

  it("renders card subcomponents cleanly", () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Card Header Title</CardTitle>
          <CardDescription>Card Header Desc</CardDescription>
        </CardHeader>
        <CardContent>Content Area</CardContent>
        <CardFooter>Footer Area</CardFooter>
      </Card>
    );

    expect(screen.getByText("Card Header Title")).toBeInTheDocument();
    expect(screen.getByText("Card Header Desc")).toBeInTheDocument();
    expect(screen.getByText("Content Area")).toBeInTheDocument();
    expect(screen.getByText("Footer Area")).toBeInTheDocument();
  });

  it("renders input and separator", () => {
    render(
      <div>
        <Input placeholder="Enter partner name" />
        <Separator />
      </div>
    );

    expect(screen.getByPlaceholderText("Enter partner name")).toBeInTheDocument();
  });

  it("renders complete table structure including header, footer and caption", () => {
    render(
      <Table>
        <TableCaption>Sample Caption</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Col 1</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Val 1</TableCell>
          </TableRow>
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell>Total</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    );

    expect(screen.getByText("Sample Caption")).toBeInTheDocument();
    expect(screen.getByText("Col 1")).toBeInTheDocument();
    expect(screen.getByText("Val 1")).toBeInTheDocument();
    expect(screen.getByText("Total")).toBeInTheDocument();
  });
});
