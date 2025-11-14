#!/usr/bin/env bash
set -euo pipefail
shopt -s nullglob

VERSION_V0="${VERSION_V0:-0.0.3}"
VERSION_V1="${VERSION_V1:-1.0.2}"
VERSION_V2="${VERSION_V2:-2.0.1}"

find_manifest() {
  local dir="$1"
  if [[ -f "$dir/module.json" ]]; then
    echo "$dir/module.json module.json"
  elif [[ -f "$dir/system.json" ]]; then
    echo "$dir/system.json system.json"
  fi
}

ensure_version() {
  local dir="$1"
  local pkg="$2"
  local version="$3"

  local manifest_info
  manifest_info="$(find_manifest "$dir" || true)"
  [[ -n "$manifest_info" ]] || return 0

  local json json_base
  json="$(cut -d' ' -f1 <<< "$manifest_info")"
  json_base="$(cut -d' ' -f2 <<< "$manifest_info")"

  local tmp="${json}.tmp"
  jq -S \
    --arg version "$version" \
    --arg repo "${GITHUB_REPOSITORY:-}" \
    --arg pkg "$pkg" \
    --arg json_base "$json_base" \
    '
      .version = $version
      | .download = ("https://raw.githubusercontent.com/" + $repo + "/main/.versions/" + $pkg + "/" + $version + "/" + $pkg + ".zip")
      | .manifest = ("https://raw.githubusercontent.com/" + $repo + "/main/.versions/" + $pkg + "/" + $version + "/" + $json_base)
    ' "$json" > "$tmp"
  mv "$tmp" "$json"
}

ensure_main_json() {
  local dir="$1"
  local pkg="$2"

  local manifest_info
  manifest_info="$(find_manifest "$dir" || true)"
  [[ -n "$manifest_info" ]] || return 0

  local json json_base
  json="$(cut -d' ' -f1 <<< "$manifest_info")"
  json_base="$(cut -d' ' -f2 <<< "$manifest_info")"

  local tmp="${json}.tmp"
  jq -S \
    --arg repo "${GITHUB_REPOSITORY:-}" \
    --arg pkg "$pkg" \
    --arg json_base "$json_base" \
    '
      .download = ("https://raw.githubusercontent.com/" + $repo + "/main/" + $pkg + "/" + $pkg + ".zip")
      | .manifest = ("https://raw.githubusercontent.com/" + $repo + "/main/" + $pkg + "/" + $json_base)
    ' "$json" > "$tmp"

  if ! cmp -s "$tmp" "$json"; then
    mv "$tmp" "$json"
    echo "Patched main manifest for ${pkg}"
  else
    rm -f "$tmp"
  fi
}

create_versioned_copies() {
  mkdir -p .versions

  for d in */ ; do
    case "$d" in
      .git/|.github/|.vscode/|.versions/|docs/|scripts/)
        continue
        ;;
    esac

    d="${d%/}"
    local name
    name="$(basename "$d")"

    for version in "${VERSION_V0}" "${VERSION_V1}" "${VERSION_V2}"; do
      local out=".versions/${name}/${version}"
      local tmp_out="${out}.tmp"

      rm -rf "$tmp_out"
      mkdir -p "$tmp_out"

      rsync -a --delete \
        --exclude '*.zip' \
        --exclude '.versions/' \
        "${d}/" "$tmp_out/"

      ensure_version "$tmp_out" "$name" "$version"

      if [[ -d "$out" ]] && diff -qr "$tmp_out" "$out" > /dev/null 2>&1; then
        rm -rf "$tmp_out"
        echo "No changes for versioned copy: $out"
      else
        rm -rf "$out"
        mv "$tmp_out" "$out"
        echo "Updated versioned copy: $out"
      fi
    done
  done
}

build_main_zips() {
  for d in */ ; do
    case "$d" in
      .git/|.github/|.vscode/|.versions/|docs/|scripts/)
        continue
        ;;
    esac

    d="${d%/}"
    local pkg="$d"

    ensure_main_json "$d" "$pkg"

    local zip_path="${d}/${d}.zip"
    local tmp_zip="${zip_path}.tmp"

    (
      cd "$d"
      zip -rqX "../${tmp_zip}" . -x "*.zip" -x ".versions/*"
    )

    if [[ ! -f "$zip_path" ]] || ! cmp -s "$tmp_zip" "$zip_path"; then
      mv "$tmp_zip" "$zip_path"
      echo "Updated main ZIP: $zip_path"
    else
      rm -f "$tmp_zip"
      echo "No changes for main ZIP: $zip_path"
    fi
  done
}

build_version_zips() {
  for version_dir in .versions/*/*/ ; do
    [[ -d "$version_dir" ]] || continue
    version_dir="${version_dir%/}"

    local pkg_dir
    pkg_dir="$(dirname "$version_dir")"
    local name
    name="${pkg_dir##*/}"

    local zip_path="${version_dir}/${name}.zip"
    local tmp_name="${name}.zip.tmp"

    (
      cd "$version_dir"
      zip -rqX "$tmp_name" . -x "*.zip" -x ".versions/*"
    )

    if [[ ! -f "$zip_path" ]] || ! cmp -s "${version_dir}/${tmp_name}" "$zip_path"; then
      mv "${version_dir}/${tmp_name}" "$zip_path"
      echo "Updated versioned ZIP: $zip_path"
    else
      rm -f "${version_dir}/${tmp_name}"
      echo "No changes for versioned ZIP: $zip_path"
    fi
  done
}

cmd="${1:-}"
case "$cmd" in
  create-versioned-copies)
    create_versioned_copies
    ;;
  build-main-zips)
    build_main_zips
    ;;
  build-version-zips)
    build_version_zips
    ;;
esac
