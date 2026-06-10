'use client';

import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { getDNBs, createDNB, updateDNB, deleteDNB } from '@/lib/actions/dnbs';

export default function DNBsPage() {
  const [dnbs, setDnbs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDNB, setEditingDNB] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    setores: '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadDNBs();
  }, []);

  async function loadDNBs() {
    try {
      const data = await getDNBs();
      setDnbs(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function openCreateDialog() {
    setEditingDNB(null);
    setFormData({ name: '', code: '', description: '', setores: '' });
    setError('');
    setDialogOpen(true);
  }

  function openEditDialog(dnb) {
    setEditingDNB(dnb);
    setFormData({
      name: dnb.name,
      code: dnb.code,
      description: dnb.description || '',
      setores: dnb.setores?.join(', ') || '',
    });
    setError('');
    setDialogOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const data = {
        name: formData.name,
        code: formData.code,
        description: formData.description,
        setores: formData.setores.split(',').map(s => s.trim()).filter(s => s),
      };

      if (editingDNB) {
        await updateDNB(editingDNB._id, data);
      } else {
        await createDNB(data);
      }

      setDialogOpen(false);
      await loadDNBs();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(dnb) {
    if (!confirm(`Deseja realmente excluir a DNB ${dnb.name}?`)) return;

    try {
      await deleteDNB(dnb._id);
      await loadDNBs();
    } catch (err) {
      alert(err.message);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-600">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">DNBs</h1>
          <p className="text-gray-600 mt-1">Gerenciamento de localidades</p>
        </div>
        <Button onClick={openCreateDialog} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Nova DNB
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>DNBs Cadastradas</CardTitle>
          <CardDescription>Lista de todas as localidades da empresa</CardDescription>
        </CardHeader>
        <CardContent>
          {dnbs.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Nenhuma DNB cadastrada</p>
          ) : (
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Setores</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dnbs.map((dnb) => (
                  <TableRow key={dnb._id}>
                    <TableCell className="font-mono font-semibold">{dnb.code}</TableCell>
                    <TableCell className="font-medium">{dnb.name}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {dnb.setores?.map((setor, idx) => (
                          <Badge key={idx} variant="secondary">
                            {setor}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{dnb.description}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(dnb)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(dnb)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingDNB ? 'Editar DNB' : 'Nova DNB'}</DialogTitle>
              <DialogDescription>
                {editingDNB
                  ? 'Atualize as informações da DNB'
                  : 'Cadastre uma nova localidade no sistema'}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="code">Código *</Label>
                <Input
                  id="code"
                  placeholder="DNB-ME"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  placeholder="DNB Macaé"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  placeholder="Base de Macaé - Rio de Janeiro"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="setores">Setores (separados por vírgula)</Label>
                <Input
                  id="setores"
                  placeholder="OPR, ADM, SUP, TI, RH"
                  value={formData.setores}
                  onChange={(e) => setFormData({ ...formData, setores: e.target.value })}
                />
                <p className="text-xs text-gray-500">Exemplo: OPR, ADM, SUP, TI</p>
              </div>

              {error && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                  {error}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Salvando...' : editingDNB ? 'Atualizar' : 'Criar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
