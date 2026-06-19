import type { BuildStatusProps } from '#/types';

export function BuildStatus(props: BuildStatusProps) {
  return (
    <div class="card">
      <div class="card-body">
        <h5>{props.buildNumber}</h5>
        <p>Status: {props.status}</p>
        <p>
          Passed: {props.testsPassed}
          <br />
          Failed: {props.testsFailed}
        </p>
      </div>
    </div>
  );
}
