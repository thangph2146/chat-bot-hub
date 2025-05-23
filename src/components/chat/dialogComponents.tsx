"use client";

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface DeleteMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}

export function DeleteMessageDialog({ 
  open, 
  onOpenChange, 
  onDelete, 
  onCancel,
  isDeleting 
}: DeleteMessageDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-red-600">Xác nhận xóa tin nhắn</DialogTitle>
          <DialogDescription>
            Bạn có chắc chắn muốn xóa tin nhắn này? Hành động này không thể hoàn tác.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-start flex gap-2 mt-2">
          <Button 
            onClick={onDelete} 
            variant="destructive"
            disabled={isDeleting}
            className="bg-primary-600 hover:bg-primary-700"
          >
            {isDeleting ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Đang xóa tin nhắn
              </span>
            ) : "Xác nhận"}
          </Button>
          <Button 
            onClick={onCancel}
            variant="secondary"
            disabled={isDeleting}
            className="bg-secondary-200 hover:bg-secondary-300 text-primary-800"
          >
            Hủy
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface DeleteSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}

export function DeleteSessionDialog({
  open,
  onOpenChange,
  onDelete,
  onCancel,
  isDeleting
}: DeleteSessionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-red-600">Xác nhận xóa cuộc trò chuyện</DialogTitle>
          <DialogDescription>
            Bạn có chắc chắn muốn xóa cuộc trò chuyện này? Tất cả tin nhắn sẽ bị xóa và không thể khôi phục.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-start flex gap-2 mt-2">
          <Button 
            onClick={onDelete} 
            variant="destructive"
            disabled={isDeleting}
            className="bg-primary-600 hover:bg-primary-700"
          >
            {isDeleting ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Đang xóa cuộc trò chuyện
              </span>
            ) : "Xác nhận"}
          </Button>
          <Button 
            onClick={onCancel}
            variant="secondary"
            disabled={isDeleting}
            className="bg-secondary-200 hover:bg-secondary-300 text-primary-800"
          >
            Hủy
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
