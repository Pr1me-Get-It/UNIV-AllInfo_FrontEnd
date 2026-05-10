import { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
    MainTab: NavigatorScreenParams<any> | undefined;
    Detail: { item: any };
    Keyword: undefined;
    Bookmark: undefined;
    Profile: undefined;
    Tetris: undefined;
    AppleGame: undefined;
    FlappyBird: undefined;
    FishingGame: undefined;
    Ranking: undefined;
    LinkSetting: undefined;
};
