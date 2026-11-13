import { controlClass, Field } from "@/components/primitives";
import {
  branchesOf,
  categoriesOf,
  chooseBranch,
  chooseCategory,
  chooseDiscipline,
  chooseTrack,
  directionsOf,
  locate,
  subjectsOf,
  subjectTag,
  type DisciplineChoice,
  type Track,
} from "@/lib/research/fields";

const HOME_FIELD =
  "h-12 w-full min-w-0 border border-line bg-sheet px-3 text-sm text-ink outline-none transition focus:border-ink";

export function DisciplineFields({
  value,
  disabled,
  variant,
  onChange,
}: {
  value: DisciplineChoice;
  disabled?: boolean;
  variant: "home" | "studio";
  onChange: (next: DisciplineChoice) => void;
}) {
  const known = locate(value.track, value.discipline);
  const categories = categoriesOf(value.track);
  const branches = value.track === "本科" ? branchesOf(value.category) : [];
  const subjects = subjectsOf(value.track, value.category, value.branch);
  const directions = directionsOf(value.discipline);
  const subjectNames = subjects.map((item) => item.name);
  const selectClass = variant === "home" ? HOME_FIELD : controlClass;

  function emit(next: DisciplineChoice) {
    onChange(next);
  }

  const trackSelect = (
    <select
      className={`${selectClass} cursor-pointer`}
      value={value.track}
      disabled={disabled}
      aria-label="培养层次"
      onChange={(event) => emit(chooseTrack(event.target.value as Track))}
    >
      <option value="研究生">研究生</option>
      <option value="本科">本科</option>
    </select>
  );
  const categorySelect = (
    <select
      className={`${selectClass} cursor-pointer`}
      value={categories.includes(value.category) ? value.category : ""}
      disabled={disabled}
      aria-label="学科门类"
      onChange={(event) => emit(chooseCategory(value.track, event.target.value))}
    >
      {value.category && !categories.includes(value.category) ? <option value="">{value.category}</option> : null}
      {!value.category ? <option value="">请选择门类</option> : null}
      {categories.map((item) => (
        <option key={item} value={item}>
          {item}
        </option>
      ))}
    </select>
  );
  const branchSelect =
    value.track === "本科" ? (
      <select
        className={`${selectClass} cursor-pointer`}
        value={branches.includes(value.branch) ? value.branch : ""}
        disabled={disabled}
        aria-label="专业类"
        onChange={(event) => emit(chooseBranch(value.category, event.target.value))}
      >
        {value.branch && !branches.includes(value.branch) ? <option value="">{value.branch}</option> : null}
        {!value.branch ? <option value="">请选择专业类</option> : null}
        {branches.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
    ) : null;
  const subjectSelect = (
    <select
      className={`${selectClass} cursor-pointer`}
      value={subjectNames.includes(value.discipline) ? value.discipline : value.discipline}
      disabled={disabled || !value.category || (value.track === "本科" && !value.branch)}
      aria-label="具体学科"
      onChange={(event) => emit(chooseDiscipline(value.track, value.category, value.branch, event.target.value))}
    >
      {value.discipline && !subjectNames.includes(value.discipline) ? <option value={value.discipline}>{value.discipline}</option> : null}
      {subjects.map((item) => (
        <option key={item.name} value={item.name}>
          {item.name}
          {subjectTag(item.kind)}
        </option>
      ))}
    </select>
  );
  const directionSelect = directions.length ? (
    <select
      className={`${selectClass} cursor-pointer`}
      value={directions.includes(value.field) ? value.field : directions[0]}
      disabled={disabled}
      aria-label="方向"
      onChange={(event) => emit({ ...value, field: event.target.value })}
    >
      {directions.map((item) => (
        <option key={item}>{item}</option>
      ))}
    </select>
  ) : null;
  const note = (
    <p className="text-xs leading-6 text-muted">
      {value.track === "本科"
        ? "本科按《普通高等学校本科专业目录（2025年）》：门类、专业类、专业。专业是这里的具体学科。"
        : "研究生按《研究生教育学科专业目录（2022年）》：门类，然后是一级学科或专业学位类别。国家目录不再单列二级学科。"}
      {known || !value.discipline ? " 研究方向供选题使用，不是国家二级学科目录。" : ` 「${value.discipline}」保留您已填写的名称。`}
    </p>
  );

  if (variant === "home") {
    return (
      <>
        <HomeRow label="培养层次">{trackSelect}</HomeRow>
        <HomeRow label="学科门类">{categorySelect}</HomeRow>
        {branchSelect ? <HomeRow label="专业类">{branchSelect}</HomeRow> : null}
        <HomeRow label="具体学科">
          <div>
            {subjectSelect}
            <div className="mt-3">{note}</div>
          </div>
        </HomeRow>
      </>
    );
  }

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="培养层次">{trackSelect}</Field>
        <Field label="学科门类">{categorySelect}</Field>
        {branchSelect ? <Field label="专业类">{branchSelect}</Field> : null}
        <Field label="具体学科">{subjectSelect}</Field>
        {directionSelect ? <Field label="方向">{directionSelect}</Field> : null}
      </div>
      <div className="mt-3">{note}</div>
    </div>
  );
}

function HomeRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-3 border-b border-line px-5 py-5 last:border-b-0 md:grid-cols-[6.5rem_1fr] md:items-start">
      <p className="text-sm text-muted md:pt-3">{label}</p>
      <div className="max-w-xl">{children}</div>
    </div>
  );
}
