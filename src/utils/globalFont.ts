import { Text, TextInput } from 'react-native';

interface TextWithDefaultProps extends Text {
    defaultProps?: { style?: any };
}

interface TextInputWithDefaultProps extends TextInput {
    defaultProps?: { style?: any };
}

export const applyGlobalFont = () => {
    // @ts-ignore
    const TextWithDefault = Text as unknown as TextWithDefaultProps;
    // @ts-ignore
    const TextInputWithDefault = TextInput as unknown as TextInputWithDefaultProps;

    const originalTextRender = TextWithDefault.render;
    const originalTextInputRender = TextInputWithDefault.render;

    // 1. Text 컴포넌트 기본 스타일 설정 (구형 방식이나 여전히 유효함)
    if (TextWithDefault.defaultProps == null) {
        TextWithDefault.defaultProps = {};
    }
    TextWithDefault.defaultProps.style = [{ fontFamily: 'IBMPlexSansKR-Regular' }];

    if (TextInputWithDefault.defaultProps == null) {
        TextInputWithDefault.defaultProps = {};
    }
    TextInputWithDefault.defaultProps.style = [{ fontFamily: 'IBMPlexSansKR-Regular' }];

    // 주의: React Native 최신 버전에서는 defaultProps가 함수형 컴포넌트에서 동작하지 않을 수 있음.
    // 확실한 방법은 커스텀 컴포넌트(CustomText)를 사용하는 것입니다.
};
