import { Modal, ProgressBar, type UseOverlayStateReturn } from "@heroui/react";
import ProcessingSVG from "./svg/ProcessingSVG";

interface ProcessingModalProps {
  state: UseOverlayStateReturn;
}

export default function ProcessingModal({ state }: ProcessingModalProps) {
  return (
    <Modal.Backdrop
      isOpen={state.isOpen}
      onOpenChange={state.setOpen}
      variant="blur"
      isDismissable={false}
      isKeyboardDismissDisabled
    >
      <Modal.Container placement="center">
        <Modal.Dialog aria-label="processing">
          <Modal.Body className="flex flex-col p-[0.3rem]">
            <ProcessingSVG className="h-[15rem]"></ProcessingSVG>

            <div className="flex text-[18pt] py-[2rem] text-foreground text-center">
              Traitement en cours, veuillez patienter...
            </div>

            <ProgressBar isIndeterminate aria-label="Loading">
              <ProgressBar.Track>
                <ProgressBar.Fill />
              </ProgressBar.Track>
            </ProgressBar>
          </Modal.Body>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
