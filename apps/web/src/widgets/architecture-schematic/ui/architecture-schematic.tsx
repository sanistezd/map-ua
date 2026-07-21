'use client';

import { motion, useReducedMotion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { integrationApi } from '@/entities/integration';
import { CornerTicks } from '@/shared/ui';

interface ModuleNode {
  id: string;
  label: string;
  caption: string;
  x: number;
  hasStatus?: boolean;
}

const NODE_Y = 140;
const NODE_W = 104;
const NODE_H = 48;
const TRUNK_Y = 112;
const HUB_X = 380;

const nodes: ModuleNode[] = [
  { id: 'auth', label: 'AUTH', caption: 'bearer guard', x: 108 },
  { id: 'users', label: 'USERS', caption: 'drizzle', x: 244 },
  { id: 'health', label: 'HEALTH', caption: '/api/health', x: 380 },
  {
    id: 'email',
    label: 'EMAIL',
    caption: 'resend · smtp',
    x: 516,
    hasStatus: true,
  },
  { id: 'storage', label: 'STORAGE', caption: 's3', x: 652, hasStatus: true },
];

export function ArchitectureSchematic() {
  const t = useTranslations('Schematic');
  const prefersReducedMotion = useReducedMotion();
  const [status, setStatus] = useState<Record<string, boolean | null>>({
    email: null,
    storage: null,
  });

  useEffect(() => {
    void integrationApi
      .emailStatus()
      .then((s) => setStatus((prev) => ({ ...prev, email: s.configured })))
      .catch(() => setStatus((prev) => ({ ...prev, email: false })));
    void integrationApi
      .storageStatus()
      .then((s) => setStatus((prev) => ({ ...prev, storage: s.configured })))
      .catch(() => setStatus((prev) => ({ ...prev, storage: false })));
  }, []);

  const lineTransition = (delay: number) => ({
    pathLength: {
      duration: prefersReducedMotion ? 0 : 0.7,
      delay,
      ease: 'easeInOut' as const,
    },
    opacity: { duration: 0.2, delay },
  });

  return (
    <div className="panel relative p-4 sm:p-6">
      <CornerTicks />
      <div className="panel-label">
        <span className="tag">FIG. A</span>
        <span>{t('label')}</span>
      </div>
      <svg
        viewBox="0 0 760 300"
        className="h-auto w-full"
        role="img"
        aria-label={t('ariaLabel')}
      >
        <g
          stroke="var(--blueprint)"
          strokeWidth="1.5"
          fill="none"
          opacity="0.8"
        >
          <motion.path
            d={`M${HUB_X},90 V${TRUNK_Y}`}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.8 }}
            transition={lineTransition(0)}
          />
          <motion.path
            d={`M${nodes[0]?.x},${TRUNK_Y} H${nodes[4]?.x}`}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.8 }}
            transition={lineTransition(0.15)}
          />
          {nodes.map((node, i) => (
            <motion.path
              key={node.id}
              d={`M${node.x},${TRUNK_Y} V${NODE_Y}`}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.8 }}
              transition={lineTransition(0.3 + i * 0.05)}
            />
          ))}
          <motion.path
            d={`M244,${NODE_Y + NODE_H} V210 H340 V230`}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.8 }}
            transition={lineTransition(0.6)}
          />
        </g>

        <g fill="var(--blueprint)">
          {[
            nodes[0]?.x,
            nodes[1]?.x,
            nodes[2]?.x,
            nodes[3]?.x,
            nodes[4]?.x,
          ].map((x) => (
            <circle key={x} cx={x} cy={TRUNK_Y} r="2.5" />
          ))}
        </g>

        {/* APP hub */}
        <motion.g
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.4 }}
        >
          <rect
            x={HUB_X - 70}
            y={40}
            width={140}
            height={50}
            rx="3"
            fill="var(--card)"
            stroke="var(--ink)"
            strokeWidth="1.5"
          />
          <text
            x={HUB_X}
            y={62}
            textAnchor="middle"
            className="font-mono"
            fontSize="12"
            fontWeight="600"
            fill="var(--ink)"
          >
            APP
          </text>
          <text
            x={HUB_X}
            y={78}
            textAnchor="middle"
            className="font-mono"
            fontSize="9"
            fill="var(--graphite)"
          >
            nest · next
          </text>
        </motion.g>

        {/* Module nodes */}
        {nodes.map((node, i) => (
          <motion.g
            key={node.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: prefersReducedMotion ? 0 : 0.35,
              delay: prefersReducedMotion ? 0 : 0.45 + i * 0.05,
            }}
          >
            <rect
              x={node.x - NODE_W / 2}
              y={NODE_Y}
              width={NODE_W}
              height={NODE_H}
              rx="3"
              fill="var(--card)"
              stroke="var(--blueprint)"
              strokeWidth="1.25"
            />
            <text
              x={node.x}
              y={NODE_Y + 21}
              textAnchor="middle"
              className="font-mono"
              fontSize="11"
              fontWeight="600"
              fill="var(--ink)"
            >
              {node.label}
            </text>
            <text
              x={node.x}
              y={NODE_Y + 36}
              textAnchor="middle"
              className="font-mono"
              fontSize="8"
              fill="var(--graphite)"
            >
              {node.caption}
            </text>
            {node.hasStatus && (
              <circle
                cx={node.x + NODE_W / 2 - 8}
                cy={NODE_Y + 8}
                r="3.5"
                fill={
                  status[node.id] === null
                    ? 'var(--graphite)'
                    : status[node.id]
                      ? 'var(--ok)'
                      : 'var(--blueprint-soft)'
                }
              />
            )}
          </motion.g>
        ))}

        {/* Database */}
        <motion.g
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: prefersReducedMotion ? 0 : 0.35,
            delay: prefersReducedMotion ? 0 : 0.7,
          }}
        >
          <rect
            x={280}
            y={230}
            width={200}
            height={46}
            rx="3"
            fill="var(--card)"
            stroke="var(--ink)"
            strokeWidth="1.5"
            strokeDasharray="4 3"
          />
          <text
            x={380}
            y={251}
            textAnchor="middle"
            className="font-mono"
            fontSize="11"
            fontWeight="600"
            fill="var(--ink)"
          >
            DATABASE
          </text>
          <text
            x={380}
            y={266}
            textAnchor="middle"
            className="font-mono"
            fontSize="8"
            fill="var(--graphite)"
          >
            postgres · shared
          </text>
        </motion.g>
      </svg>
    </div>
  );
}
