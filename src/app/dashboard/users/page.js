'use client';

import { useEffect, useState, useRef } from 'react';
import { Plus, Pencil, Trash2, KeyRound } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { getUsers, createUser, updateUser, deleteUser, resetUserPassword } from '@/lib/actions/users';
import { getDNBs } from '@/lib/actions/dnbs';

const ROLE_LABELS = {
  tecnico: 'Técnico',
  gestor: 'Gestor',
  administrador: 'Administrador',
};

const ROLE_COLORS = {
  tecnico: 'info',
  gestor: 'warning',
  administrador: 'destructive',
};

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [dnbs, setDnbs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [resetPasswordDialog, setResetPasswordDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'tecnico',
    dnbs: [],
  });
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const formRef = useRef(null);
  const saveAndNextRef = useRef(false);
  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState('asc');

  function handleSort(col) {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  }

  function getVal(obj, path) {
    return path.split('.').reduce((o, k) => o?.[k], obj) ?? '';
  }

  const sortedUsers = [...users].sort((a, b) => {
    if (!sortCol) return 0;
    const av = String(getVal(a, sortCol)).toLowerCase();
    const bv = String(getVal(b, sortCol)).toLowerCase();
    return sortDir === 'asc' ? av.localeCompare(bv, 'pt') : bv.localeCompare(av, 'pt');
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [usersData, dnbsData] = await Promise.all([getUsers(), getDNBs()]);
      setUsers(usersData);
      setDnbs(dnbsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function openCreateDialog() {
    setEditingUser(null);
    setFormData({ name: '', email: '', password: '', role: 'tecnico', dnbs: [] });
    setError('');
    setDialogOpen(true);
  }

  function openEditDialog(user) {
    setEditingUser(user);
    // Suporta múltiplas DNBs (novo) e DNB única (legado)
    const userDnbIds = user.dnbs && user.dnbs.length > 0
      ? user.dnbs.map(d => d._id)
      : (user.dnb ? [user.dnb._id] : []);

    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      dnbs: userDnbIds,
    });
    setError('');
    setDialogOpen(true);
  }

  function openResetPasswordDialog(user) {
    setSelectedUser(user);
    setNewPassword('');
    setError('');
    setResetPasswordDialog(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const data = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
      };

      // Para técnicos, adicionar DNBs
      if (formData.role === 'tecnico') {
        data.dnbs = formData.dnbs || [];

        // Validar que pelo menos uma DNB foi selecionada
        if (data.dnbs.length === 0) {
          setError('Técnicos devem ter pelo menos uma DNB atrelada');
          setSubmitting(false);
          return;
        }

        // Manter compatibilidade: se tiver apenas 1 DNB, também setar o campo dnb
        if (data.dnbs.length > 0) {
          data.dnb = data.dnbs[0];
        }
      }

      if (formData.password) {
        data.password = formData.password;
      }

      if (editingUser) {
        await updateUser(editingUser._id, data);
      } else {
        if (!formData.password) {
          setError('Senha é obrigatória para novos usuários');
          setSubmitting(false);
          return;
        }
        data.password = formData.password;
        await createUser(data);
      }

      if (saveAndNextRef.current) {
        saveAndNextRef.current = false;
        setFormData({ name: '', email: '', password: '', role: 'tecnico', dnbs: [] });
        setSavedFlash(true);
        setTimeout(() => setSavedFlash(false), 2000);
        await loadData();
      } else {
        saveAndNextRef.current = false;
        setDialogOpen(false);
        await loadData();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResetPassword(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await resetUserPassword(selectedUser._id, newPassword);
      setResetPasswordDialog(false);
      alert('Senha resetada com sucesso!');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(user) {
    if (!confirm(`Deseja realmente excluir o usuário ${user.name}?`)) return;

    try {
      await deleteUser(user._id);
      await loadData();
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
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Usuários</h1>
          <p className="text-gray-600 mt-1">Gerenciamento de usuários do sistema</p>
        </div>
        <Button onClick={openCreateDialog} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Novo Usuário
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Usuários Cadastrados</CardTitle>
          <CardDescription>Lista de todos os usuários ativos</CardDescription>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Nenhum usuário cadastrado</p>
          ) : (
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    onClick={() => handleSort('name')}
                    className="cursor-pointer select-none"
                    style={{ userSelect: 'none' }}
                  >
                    <span className="flex items-center gap-1">
                      Nome
                      <span style={{ opacity: sortCol === 'name' ? 1 : 0.25, fontSize: '10px' }}>
                        {sortCol === 'name' && sortDir === 'desc' ? '▼' : '▲'}
                      </span>
                    </span>
                  </TableHead>
                  <TableHead
                    onClick={() => handleSort('email')}
                    className="cursor-pointer select-none"
                    style={{ userSelect: 'none' }}
                  >
                    <span className="flex items-center gap-1">
                      Email
                      <span style={{ opacity: sortCol === 'email' ? 1 : 0.25, fontSize: '10px' }}>
                        {sortCol === 'email' && sortDir === 'desc' ? '▼' : '▲'}
                      </span>
                    </span>
                  </TableHead>
                  <TableHead
                    onClick={() => handleSort('role')}
                    className="cursor-pointer select-none"
                    style={{ userSelect: 'none' }}
                  >
                    <span className="flex items-center gap-1">
                      Papel
                      <span style={{ opacity: sortCol === 'role' ? 1 : 0.25, fontSize: '10px' }}>
                        {sortCol === 'role' && sortDir === 'desc' ? '▼' : '▲'}
                      </span>
                    </span>
                  </TableHead>
                  <TableHead>DNB</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedUsers.map((user) => (
                  <TableRow key={user._id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={ROLE_COLORS[user.role]}>
                        {ROLE_LABELS[user.role]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.dnbs && user.dnbs.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {user.dnbs.map((dnb) => (
                            <span key={dnb._id} className="font-mono text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                              {dnb.code}
                            </span>
                          ))}
                        </div>
                      ) : user.dnb ? (
                        <span className="font-mono text-sm">{user.dnb.code}</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openResetPasswordDialog(user)}
                        >
                          <KeyRound className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(user)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(user)}
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

      {/* Dialog de Criar/Editar */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleSubmit} ref={formRef}>
            <DialogHeader>
              <DialogTitle>{editingUser ? 'Editar Usuário' : 'Novo Usuário'}</DialogTitle>
              <DialogDescription>
                {editingUser
                  ? 'Atualize as informações do usuário'
                  : 'Cadastre um novo usuário no sistema'}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  placeholder="João Silva"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="joao@navbrasil.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="password">
                  Senha {editingUser ? '(deixe em branco para não alterar)' : '*'}
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required={!editingUser}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="role">Papel *</Label>
                <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o papel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tecnico">Técnico</SelectItem>
                    <SelectItem value="gestor">Gestor</SelectItem>
                    <SelectItem value="administrador">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.role === 'tecnico' && (
                <div className="grid gap-2">
                  <Label htmlFor="dnbs">DNBs * (selecione uma ou mais)</Label>
                  <div className="border rounded-md p-3 max-h-48 overflow-y-auto bg-white">
                    {dnbs.length === 0 ? (
                      <p className="text-sm text-gray-500">Nenhuma DNB disponível</p>
                    ) : (
                      <div className="space-y-2">
                        {dnbs.map((dnb) => (
                          <label key={dnb._id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                            <input
                              type="checkbox"
                              checked={formData.dnbs.includes(dnb._id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormData({ ...formData, dnbs: [...formData.dnbs, dnb._id] });
                                } else {
                                  setFormData({ ...formData, dnbs: formData.dnbs.filter(id => id !== dnb._id) });
                                }
                              }}
                              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <span className="text-sm">
                              <span className="font-mono font-medium">{dnb.code}</span> - {dnb.name}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                  {formData.dnbs.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {formData.dnbs.map(dnbId => {
                        const dnb = dnbs.find(d => d._id === dnbId);
                        return dnb ? (
                          <span key={dnbId} className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                            {dnb.code}
                            <button
                              type="button"
                              onClick={() => setFormData({ ...formData, dnbs: formData.dnbs.filter(id => id !== dnbId) })}
                              className="hover:text-blue-900"
                            >
                              ×
                            </button>
                          </span>
                        ) : null;
                      })}
                    </div>
                  )}
                </div>
              )}

              {error && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                  {error}
                </div>
              )}
            </div>

            {savedFlash && (
              <div className="text-sm text-green-700 bg-green-50 p-3 rounded-md mb-4">✓ Usuário criado com sucesso!</div>
            )}

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              {!editingUser && (
                <Button type="button" variant="outline" disabled={submitting}
                  onClick={() => { saveAndNextRef.current = true; formRef.current?.requestSubmit(); }}>
                  + Próximo
                </Button>
              )}
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Salvando...' : editingUser ? 'Atualizar' : 'Salvar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de Reset de Senha */}
      <Dialog open={resetPasswordDialog} onOpenChange={setResetPasswordDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <form onSubmit={handleResetPassword}>
            <DialogHeader>
              <DialogTitle>Resetar Senha</DialogTitle>
              <DialogDescription>
                Resetar senha do usuário {selectedUser?.name}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="newPassword">Nova Senha *</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              {error && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                  {error}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setResetPasswordDialog(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Resetando...' : 'Resetar Senha'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
