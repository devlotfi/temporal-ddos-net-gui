import { Card, cn, type CardProps } from "@heroui/react";
import type { IconName } from "lucide-react/dynamic";
import type { PropsWithChildren } from "react";
import SectionHeader from "./section-header";

function CardTitle({ icon, title }: { icon: IconName; title: string }) {
  return (
    <div className="flex flex-col">
      <SectionHeader
        icon={icon}
        className="py-0 p-[0.5rem] gap-[1rem] md:gap-[1rem]"
        iconWrapperProps={{
          className: "size-[2.2rem]",
        }}
        iconProps={{
          className: "size-[1.6rem]",
        }}
        labelProps={{
          className: "text-[15pt]",
        }}
      >
        {title}
      </SectionHeader>
    </div>
  );
}

interface CardWithTitleProps extends CardProps {
  icon: IconName;
  title: string;
}

export default function CardWithTitle({
  icon,
  title,
  children,
  className,
  ...props
}: PropsWithChildren<CardWithTitleProps>) {
  return (
    <Card
      className={cn(
        "p-0 bg-[color-mix(in_srgb,var(--surface),transparent_50%)]",
        className,
      )}
      {...props}
    >
      <Card.Content className="gap-0">
        <CardTitle icon={icon} title={title}></CardTitle>

        <div className="flex flex-col border-t border-border bg-surface rounded-t-3xl pt-0">
          {children}
        </div>
      </Card.Content>
    </Card>
  );
}
