export const GestureNames = {
  None: 'None',
  Closed_Fist: 'Closed_Fist',
  Open_Palm: 'Open_Palm',
  Pointing_Up: 'Pointing_Up',
  Thumb_Down: 'Thumb_Down',
  Thumb_Up: 'Thumb_Up',
  Victory: 'Victory',
  ILoveYou: 'ILoveYou',
};

export const GestureActionKind = { ADD: 'ADD', UPDATE: 'UPDATE' } as const;

export interface StoredGesture {
  name: string;
  location: {
    x: number;
    y: number;
  };
}

export interface GestureAction {
  type: string;
  data: StoredGesture;
}

export interface GestureState {
  gesturePipe: Array<StoredGesture>;
  currentGesture: StoredGesture;
}

export const initialGesture: GestureState = {
  gesturePipe: [],
  currentGesture: {
    name: GestureNames.None,
    location: {
      x: -1,
      y: -1,
    },
  },
};

export const gestureReducer = (
  state: GestureState,
  action: GestureAction
): GestureState => {
  const { type, data } = action;
  const length = state.gesturePipe.length;
  switch (type) {
    case GestureActionKind.ADD: {
      if (length >= 8) {
        state.gesturePipe.shift();
      }
      return {
        gesturePipe: [...state.gesturePipe, data],
        currentGesture: state.currentGesture,
      };
    }
    case GestureActionKind.UPDATE:
      return {
        gesturePipe: state.gesturePipe,
        currentGesture: data,
      };
    default:
      return state;
  }
};
