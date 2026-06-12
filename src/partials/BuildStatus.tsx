interface BuildStatusProps {
  buildNumber: string;
  status: string;
  testsPassed: number;
  testsFailed: number;
}

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
