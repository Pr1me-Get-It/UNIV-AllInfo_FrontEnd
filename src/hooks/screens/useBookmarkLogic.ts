import { useContext } from 'react';
import { AlarmContext } from '../../data/Alarm';
import { useAuth } from '../../context/AuthContext';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';

export interface BookmarkItem {
  id: string | number;
  title: string;
  image: any;
  [key: string]: any;
}

export const useBookmarkLogic = (navigation: NativeStackNavigationProp<RootStackParamList, 'Bookmark'>) => {
  const context = useContext(AlarmContext);
  const { bookmarkStatus } = context || { bookmarkStatus: {} };

  const { userEmail, isAuthenticated } = useAuth();

  const bookmarkedItems = bookmarkStatus ? (Object.values(bookmarkStatus) as BookmarkItem[]) : [];

  const handlePressItem = (item: BookmarkItem) => {
    navigation.navigate('Detail', { item });
  };

  return {
    isAuthenticated,
    bookmarkedItems,
    handlePressItem,
  };
};
