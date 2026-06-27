import { useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../../services/supabaseClient';
import type { ProjectState } from '../../types';
import { DEFAULT_THEME } from '../../theme/themes';
import { notify } from '../../services/notifications';

const EMPTY_PROJECT_STATE: ProjectState = {
  projectName: '',
  chapters: [],
  scenes: [],
  storyBible: {
    characters: [],
    locations: [],
    factions: [],
    powerSystems: []
  },
  plotThreads: [],
  snapshots: [],
  notes: [],
  memoryUpdates: [],
  continuityFacts: [],
  bibleItemVersions: [],
  settings: {
    apiKey: '',
    model: 'gemini-1.5-flash',
    provider: 'gemini',
    aiTemperature: 0.7,
    typewriterMode: false,
    focusMode: false,
    splitView: false,
    theme: DEFAULT_THEME
  }
};

export const useAuth = (
  setUser: React.Dispatch<React.SetStateAction<User | null>>,
  setAuthLoading: React.Dispatch<React.SetStateAction<boolean>>,
  setActiveBookId: React.Dispatch<React.SetStateAction<string | null>>,
  setProject: React.Dispatch<React.SetStateAction<ProjectState>>,
  setBooksList: React.Dispatch<React.SetStateAction<any[]>>
) => {
  useEffect(() => {
    supabase.auth.getSession().then((res: any) => {
      const session = res.data?.session;
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
      if (!session) {
        // Logged out
        setActiveBookId(null);
        setProject(EMPTY_PROJECT_STATE);
        setBooksList([]);
      }
    });

    return () => subscription.unsubscribe();
  }, [setUser, setAuthLoading, setActiveBookId, setProject, setBooksList]);

  const signUp = async (email: string, password: string) => {
    return await supabase.auth.signUp({ email, password });
  };

  const signIn = async (email: string, password: string) => {
    return await supabase.auth.signInWithPassword({ email, password });
  };

  const signOut = async () => {
    const res = await supabase.auth.signOut();
    setUser(null);
    setActiveBookId(null);
    setBooksList([]);
    setProject(EMPTY_PROJECT_STATE);
    return res;
  };

  const updateUserSettings = async (settings: any) => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      const currentMeta = currentUser?.user_metadata?.novelsynth_settings || {};
      const { data, error } = await supabase.auth.updateUser({
        data: {
          novelsynth_settings: {
            ...currentMeta,
            ...settings
          }
        }
      });
      if (error) throw error;
      if (data.user) {
        setUser(data.user);
      }
    } catch (err) {
      console.error('Failed to update user settings:', err);
      notify({
        tone: 'error',
        title: 'Settings not saved',
        message: 'Failed to update user settings.'
      });
    }
  };

  return { signUp, signIn, signOut, updateUserSettings };
};
