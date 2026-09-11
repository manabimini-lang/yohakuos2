import type { YuiUnifiedAction } from "./unified_action_service";

export async function executeAction(userId: string, action: YuiUnifiedAction) {
  // Stub implementation separating logic by actionType
  switch (action.actionType) {
    case "reply_email":
      return { status: "success", actionType: action.actionType, executed: true, message: "Gmailに下書きを作成しました" };
    
    case "schedule_meeting":
      return { status: "success", actionType: action.actionType, executed: true, message: "カレンダーに予定を登録しました" };
      
    case "create_goal":
      return { status: "success", actionType: action.actionType, executed: true, message: "目的を作成しました" };
      
    case "create_timeblock":
      return { status: "success", actionType: action.actionType, executed: true, message: "時間枠を作成しました" };
      
    case "create_reflection":
      return { status: "success", actionType: action.actionType, executed: true, message: "振り返りの下書きを作成しました" };
      
    default:
      return { status: "error", actionType: action.actionType, executed: false, message: "この操作にはまだ対応していません" };
  }
}
