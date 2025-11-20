import { useMemo } from 'react';

/**
 * Hook personalizado para organizar chats por fecha
 * Agrupa los chats en: Hoy, Ayer, Esta semana, Más antiguos
 */
export const useChatOrganization = (chats) => {
  const groupedChats = useMemo(() => {
    if (!chats || chats.length === 0) return {};

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const groups = {
      pinned: [],
      today: [],
      yesterday: [],
      thisWeek: [],
      older: []
    };

    chats.forEach(chat => {
      // Si está anclado, va al grupo de anclados
      if (chat.anclado) {
        groups.pinned.push(chat);
        return;
      }

      // Parsear la fecha del último mensaje
      const messageDate = new Date(chat.ultimo_mensaje);
      const messageDateOnly = new Date(
        messageDate.getFullYear(),
        messageDate.getMonth(),
        messageDate.getDate()
      );

      // Clasificar por fecha
      if (messageDateOnly.getTime() === today.getTime()) {
        groups.today.push(chat);
      } else if (messageDateOnly.getTime() === yesterday.getTime()) {
        groups.yesterday.push(chat);
      } else if (messageDateOnly >= weekAgo) {
        groups.thisWeek.push(chat);
      } else {
        groups.older.push(chat);
      }
    });

    return groups;
  }, [chats]);

  const sections = useMemo(() => {
    const result = [];

    if (groupedChats.pinned?.length > 0) {
      result.push({
        title: 'Anclados',
        key: 'pinned',
        chats: groupedChats.pinned,
        icon: '📌'
      });
    }

    if (groupedChats.today?.length > 0) {
      result.push({
        title: 'Hoy',
        key: 'today',
        chats: groupedChats.today,
        icon: '📅'
      });
    }

    if (groupedChats.yesterday?.length > 0) {
      result.push({
        title: 'Ayer',
        key: 'yesterday',
        chats: groupedChats.yesterday,
        icon: '🕐'
      });
    }

    if (groupedChats.thisWeek?.length > 0) {
      result.push({
        title: 'Esta semana',
        key: 'thisWeek',
        chats: groupedChats.thisWeek,
        icon: '📆'
      });
    }

    if (groupedChats.older?.length > 0) {
      result.push({
        title: 'Más antiguos',
        key: 'older',
        chats: groupedChats.older,
        icon: '🗂️'
      });
    }

    return result;
  }, [groupedChats]);

  return { groupedChats, sections };
};

/**
 * Hook para manejar scroll infinito
 */
export const useInfiniteScroll = (callback, hasMore) => {
  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;

    // Cuando está cerca del final (100px del fondo)
    if (scrollHeight - scrollTop - clientHeight < 100 && hasMore) {
      callback();
    }
  };

  return handleScroll;
};
