'use client'

import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface NameCaptureDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  nameInput: string
  setNameInput: (val: string) => void
  onSave: () => void
}

export function NameCaptureDialog({ open, onOpenChange, nameInput, setNameInput, onSave }: NameCaptureDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>¿Cómo quieres que te mencionemos?</DialogTitle>
          <DialogDescription>
            Ingresa un nombre para tu cuenta. Podrás cambiarlo más adelante.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="user-display-name">Tu nombre</Label>
          <Input
            id="user-display-name"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder="Ej: Juan, Anita, NaNoX"
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={onSave}>Guardar</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}