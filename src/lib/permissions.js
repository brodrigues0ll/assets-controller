// Funções para verificar permissões baseadas em roles

export const ROLES = {
  TECNICO: 'tecnico',
  GESTOR: 'gestor',
  ADMINISTRADOR: 'administrador'
};

export function canViewAllDNBs(role) {
  return [ROLES.GESTOR, ROLES.ADMINISTRADOR].includes(role);
}

export function canEditAllDNBs(role) {
  return [ROLES.GESTOR, ROLES.ADMINISTRADOR].includes(role);
}

export function canEditAsset(user, asset) {
  // Administrador e Gestor podem editar tudo
  if ([ROLES.ADMINISTRADOR, ROLES.GESTOR].includes(user.role)) {
    return true;
  }

  // Técnico só pode editar ativos de suas DNBs
  if (user.role === ROLES.TECNICO) {
    // Suporta múltiplas DNBs (novo) e DNB única (legado)
    const userDnbs = user.dnbs || (user.dnb ? [user.dnb] : []);
    if (userDnbs.length === 0) return false;

    const assetDnbId = asset.dnb.toString();
    return userDnbs.some(dnb => {
      const dnbId = typeof dnb === 'object' ? dnb.id || dnb._id : dnb;
      return dnbId.toString() === assetDnbId;
    });
  }

  return false;
}

export function canCreateAssetInDNB(user, dnbId) {
  // Administrador e Gestor podem criar ativos em qualquer DNB
  if ([ROLES.ADMINISTRADOR, ROLES.GESTOR].includes(user.role)) {
    return true;
  }

  // Técnico só pode criar ativos em suas DNBs
  if (user.role === ROLES.TECNICO) {
    // Suporta múltiplas DNBs (novo) e DNB única (legado)
    const userDnbs = user.dnbs || (user.dnb ? [user.dnb] : []);
    if (userDnbs.length === 0) return false;

    const targetDnbId = dnbId.toString();
    return userDnbs.some(dnb => {
      const dnbObjId = typeof dnb === 'object' ? dnb.id || dnb._id : dnb;
      return dnbObjId.toString() === targetDnbId;
    });
  }

  return false;
}

export function canManageUsers(role) {
  return [ROLES.GESTOR, ROLES.ADMINISTRADOR].includes(role);
}

export function canManageDNBs(role) {
  return [ROLES.GESTOR, ROLES.ADMINISTRADOR].includes(role);
}

export function canConfigureSystem(role) {
  return role === ROLES.ADMINISTRADOR;
}

export function canResetPassword(role) {
  return [ROLES.GESTOR, ROLES.ADMINISTRADOR].includes(role);
}

export function canViewAuditLogs(role) {
  return [ROLES.GESTOR, ROLES.ADMINISTRADOR].includes(role);
}

export function canExportData(role) {
  return [ROLES.GESTOR, ROLES.ADMINISTRADOR].includes(role);
}

// Hierarquia de roles (quanto maior o número, maior a autoridade)
const ROLE_HIERARCHY = {
  [ROLES.TECNICO]: 1,
  [ROLES.GESTOR]: 2,
  [ROLES.ADMINISTRADOR]: 3
};

/**
 * Verifica se um usuário pode remover outro baseado em hierarquia
 * Regras:
 * - Técnico não pode remover ninguém
 * - Gestor pode remover técnicos e outros gestores
 * - Administrador pode remover qualquer um (técnicos, gestores e administradores)
 */
export function canDeleteUser(userRole, targetUserRole) {
  // Técnico não pode remover ninguém
  if (userRole === ROLES.TECNICO) {
    return false;
  }

  const targetLevel = ROLE_HIERARCHY[targetUserRole] || 0;

  // Gestor pode remover técnicos e outros gestores (nível <= ao seu)
  if (userRole === ROLES.GESTOR) {
    return targetLevel <= ROLE_HIERARCHY[ROLES.GESTOR];
  }

  // Administrador pode remover qualquer um
  if (userRole === ROLES.ADMINISTRADOR) {
    return true;
  }

  return false;
}
