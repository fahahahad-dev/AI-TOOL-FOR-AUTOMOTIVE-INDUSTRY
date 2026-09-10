import { Background } from '@/components/ui/Background';
import { FeatureCard } from '@/modules/landing/FeatureCard';
import { Section } from '@/modules/landing/Section';
import {
  FolderGit2,
  FileCode2,
  ShieldCheck,
  Bot,
  MessageSquareCode,
  GitBranch,
} from 'lucide-react';

export const Features = () => {
  return (
    <Background className="bg-gradient-to-b from-blue-50 via-cyan-50 to-white">
      <Section
        subtitle="Core Capabilities"
        title="Key Features of the System"
        description="An AI-powered platform designed to manage automotive codebases, validate MISRA C compliance, and intelligently assist developers through an interactive editor and AI agents."
      >
        <div className="grid grid-cols-1 gap-x-8 gap-y-12 md:grid-cols-3">

          <FeatureCard
            icon={<FolderGit2 className="w-6 h-6 text-primary-foreground" />}
            title="Project Management"
          >
            Secure OAuth login using Google and GitHub. Upload local projects,
            clone repositories from GitHub, edit metadata, duplicate projects,
            or remove them entirely.
          </FeatureCard>

          <FeatureCard
            icon={<FileCode2 className="w-6 h-6 text-primary-foreground" />}
            title="Advanced Code Editor"
          >
            Monaco-based editor with folder tree navigation, multi-file tab
            support, syntax highlighting, and real-time tracking of unsaved
            changes across files.
          </FeatureCard>

          <FeatureCard
            icon={<ShieldCheck className="w-6 h-6 text-primary-foreground" />}
            title="MISRA C Compliance Validation"
          >
            Scan C source files for MISRA C rule violations. View detailed,
            line-level diagnostics and generate structured compliance reports
            for automotive software validation.
          </FeatureCard>

          <FeatureCard
            icon={<Bot className="w-6 h-6 text-primary-foreground" />}
            title="AI-Powered Code Fixes"
          >
            Request an AI agent to automatically fix detected violations.
            Changes are applied directly in the editor with visual
            accept/reject controls for human-in-the-loop verification.
          </FeatureCard>

          <FeatureCard
            icon={<GitBranch className="w-6 h-6 text-primary-foreground" />}
            title="Inline AI Suggestions"
          >
            Trigger AI suggestions directly inside the editor using keyboard
            shortcuts. Review, accept, or reject suggestions using both visual
            controls and shortcut keys.
          </FeatureCard>

          <FeatureCard
            icon={<MessageSquareCode className="w-6 h-6 text-primary-foreground" />}
            title="AI Chat Agent"
          >
            Interact with an AI chat agent for guidance and explanations.
            Attach files, interact with code blocks, and export chat sessions
            in JSON format for documentation and analysis.
          </FeatureCard>

        </div>
      </Section>
    </Background>
  );
};
