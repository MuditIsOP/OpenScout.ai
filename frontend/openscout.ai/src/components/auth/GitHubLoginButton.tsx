import React from 'react';
import { Github } from 'lucide-react';
import { Button } from '../ui/Button';

interface GitHubLoginButtonProps {
  onClick: () => void;
  isLoading?: boolean;
}

export function GitHubLoginButton({ onClick, isLoading = false }: GitHubLoginButtonProps) {
  return (
    <Button
      variant="primary"
      size="lg"
      className="w-full relative overflow-hidden group hover:shadow-[0_0_25px_rgba(59,130,246,0.35)] duration-500"
      onClick={onClick}
      isLoading={isLoading}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      <div className="flex items-center justify-center gap-3">
        <Github className="w-5 h-5 text-white transition-transform group-hover:rotate-12 duration-300" />
        <span className="font-display tracking-wide font-medium">Continue with GitHub</span>
      </div>
    </Button>
  );
}
