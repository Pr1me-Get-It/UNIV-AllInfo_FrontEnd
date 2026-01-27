import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';

/**
 * 커스텀 알림창 컴포넌트
 * @param {boolean} visible - 알림창 표시 여부
 * @param {string} title - 알림 제목
 * @param {string} message - 알림 내용
 * @param {function} onClose - 닫기 버튼 눌렀을 때 실행될 함수
 */
interface CustomAlertProps {
    visible: boolean;
    title: string;
    message: string;
    onClose: () => void;
    onConfirm?: () => void; // [추가] 확인 버튼 콜백 (있으면 2버튼 모드)
}

const CustomAlert = ({ visible, title, message, onClose, onConfirm }: CustomAlertProps) => {
    return (
        <Modal
            transparent={true} // 배경을 투명하게 해서 뒤가 비치도록 설정
            animationType="fade" // 나타날 때 페이드 효과 (fade, slide, none)
            visible={visible}
            onRequestClose={onClose} // 안드로이드 뒤로가기 버튼 대응
        >
            <View style={styles.overlay}>
                <View style={styles.alertBox}>
                    {/* 제목 영역 */}
                    <Text style={styles.title}>{title}</Text>

                    {/* 내용 영역 */}
                    <Text style={styles.message}>{message}</Text>

                    {/* 버튼 영역 */}
                    {onConfirm ? (
                        <View style={styles.buttonRow}>
                            <TouchableOpacity
                                style={[styles.button, styles.cancelButton]}
                                onPress={onClose}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.cancelButtonText}>취소</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.button, styles.confirmButton]}
                                onPress={() => {
                                    onConfirm();
                                    onClose();
                                }}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.buttonText}>확인</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <TouchableOpacity
                            style={styles.fullButton}
                            onPress={onClose}
                            activeOpacity={0.8} // 버튼 눌렀을 때 투명도
                        >
                            <Text style={styles.buttonText}>확인</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    // 1. 전체 배경 (어두운 반투명 영역)
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)', // 검정색 투명도 50%
        justifyContent: 'center', // 세로 중앙 정렬
        alignItems: 'center', // 가로 중앙 정렬
    },

    // 2. 알림창 박스 (흰색 카드)
    alertBox: {
        width: Dimensions.get('window').width * 0.8, // 화면 너비의 80% 크기
        backgroundColor: '#ffffff', // 배경색: 흰색
        borderRadius: 20, // 모서리 둥글게 (값이 클수록 둥그러짐)
        padding: 24, // 내부 여백
        alignItems: 'center', // 내부 요소 중앙 정렬
        elevation: 5, // 안드로이드 그림자
        shadowColor: '#000', // iOS 그림자 색상
        shadowOffset: { width: 0, height: 2 }, // iOS 그림자 방향
        shadowOpacity: 0.25, // iOS 그림자 진하기
        shadowRadius: 4, // iOS 그림자 퍼짐 정도
    },

    // 3. 제목 스타일
    title: {
        fontSize: 18, // 글자 크기
        fontWeight: 'bold', // 글자 굵기
        color: '#333333', // 글자 색상 (진한 회색)
        marginBottom: 12, // 제목과 내용 사이 간격
        textAlign: 'center', // 텍스트 중앙 정렬
    },

    // 4. 내용 스타일
    message: {
        fontSize: 14, // 글자 크기
        color: '#666666', // 글자 색상 (연한 회색)
        marginBottom: 24, // 내용과 버튼 사이 간격
        textAlign: 'center',
        lineHeight: 20, // 줄 간격 (가독성 증가)
    },

    // 5. 버튼 공통 스타일
    button: {
        borderRadius: 12,
        alignItems: 'center',
        paddingVertical: 12,
        flex: 1, // 2개일 때 반반 차지
    },
    // 1개일 때 꽉 차게
    fullButton: {
        backgroundColor: 'rgb(219, 31, 38)',
        width: '100%',
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
    },
    // 2개일 때 컨테이너
    buttonRow: {
        flexDirection: 'row',
        gap: 10,
        width: '100%',
    },
    // 취소 버튼 (회색)
    cancelButton: {
        backgroundColor: '#f0f0f0',
    },
    // 확인 버튼 (빨간색)
    confirmButton: {
        backgroundColor: 'rgb(219, 31, 38)',
    },
    cancelButtonText: {
        color: '#666',
        fontSize: 16,
        fontWeight: 'bold',
    },

    // 6. 버튼 글씨 스타일
    buttonText: {
        color: '#ffffff', // 글씨 색상 (흰색)
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default CustomAlert;
