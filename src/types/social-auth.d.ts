/** Google Identity Services (GIS) 전역 타입 */

export type GoogleCredentialResponse = {
  credential: string;
  select_by?: string;
  clientId?: string;
};

declare global {
  interface Window {
    /** GIS — g_id_onload data-callback 또는 initialize callback */
    handleCredentialResponse?: (response: GoogleCredentialResponse) => void;
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback?: (response: GoogleCredentialResponse) => void;
            login_uri?: string;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
            context?: "signin" | "signup" | "use";
            itp_support?: boolean;
            use_fedcm_for_prompt?: boolean;
          }) => void;
          prompt: (
            momentListener?: (notification: {
              isNotDisplayed: () => boolean;
              isSkippedMoment: () => boolean;
              getNotDisplayedReason: () => string;
              getSkippedReason: () => string;
            }) => void
          ) => void;
          cancel: () => void;
          disableAutoSelect: () => void;
          revoke: (hint: string, callback: () => void) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              type?: string;
              theme?: string;
              size?: string;
              text?: string;
              shape?: string;
              logo_alignment?: string;
              width?: number;
              locale?: string;
              ux_mode?: "popup" | "redirect";
              login_uri?: string;
            }
          ) => void;
        };
      };
    };
  }
}

export {};
